import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { ArticleBlock, CategorySummary, IngestArticleRequest } from "../packages/contracts/src/index.ts";
import { createSlug } from "../apps/api/src/lib/slug.ts";

type SourceRegistryItem = {
  id: string;
  name: string;
  type: "rss" | "blog" | "media" | "wechat";
  entryUrl: string;
  rssUrl?: string;
  language: "zh" | "en" | "mixed";
  translationMode: "required" | "optional" | "none";
  defaultCategory: string;
  priorityWeight: number;
  rewriteEligibility: "original" | "curated" | "review";
  active: boolean;
};

type SourceTrailItem = NonNullable<IngestArticleRequest["sourceTrail"]>[number];

type CandidateArticle = {
  source: SourceRegistryItem;
  sourceUrl: string;
  sourceTitle: string;
  sourceAuthor?: string;
  sourcePublishedAt?: string;
  originalLanguage: "zh" | "en";
  coverImageUrl: string | null;
  rawBlocks: ArticleBlock[];
  sanitizedBlocks: ArticleBlock[];
  finalBlocks: ArticleBlock[];
  finalTitle: string;
  finalSlug: string;
  finalExcerpt: string;
  finalLede: string;
  finalReadingTime: string;
  finalHighlights: string[];
  categorySlug: string;
  tone: "pink" | "blue" | "green" | "aurora";
  confidenceScore: number;
  publishMode: "auto" | "review";
  kind: "ORIGINAL" | "CURATED";
  rewriteMode: "multi-source-original" | "single-source-translation-review" | "single-source-curated-review";
  sourceTrail: SourceTrailItem[];
  topicFingerprint: string;
};

type ExtractedArticle = {
  title: string;
  author?: string;
  publishedAt?: string;
  coverImageUrl: string | null;
  blocks: ArticleBlock[];
};

type MetadataResult = {
  title: string;
  excerpt: string;
  lede: string;
  highlights: string[];
  tone: CandidateArticle["tone"];
  categorySlug?: string;
};

const scriptFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptFilePath), "..");
const outputDirectory = path.join(repoRoot, "output", "openclaw");
const sourceRegistryPath = path.resolve(repoRoot, process.env.OPENCLAW_SOURCE_REGISTRY_PATH ?? "scripts/openclaw-sources.json");
const xblogApiBaseUrl = process.env.XBLOG_API_BASE_URL ?? "http://127.0.0.1:3001";
const xblogApiToken = process.env.XBLOG_API_TOKEN ?? "";
const fallbackCategorySlug = process.env.XBLOG_FALLBACK_CATEGORY_SLUG ?? "toolcraft";
const defaultTone = (process.env.XBLOG_DEFAULT_TONE as CandidateArticle["tone"] | undefined) ?? "aurora";
const defaultAuthorRoleLabel = process.env.XBLOG_DEFAULT_AUTHOR_ROLE_LABEL ?? "OpenClaw";
const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const translationProvider = process.env.OPENCLAW_TRANSLATION_PROVIDER ?? (openAiApiKey ? "openai" : "none");
const libreTranslateApiUrl = process.env.OPENCLAW_TRANSLATION_API_URL ?? "";
const libreTranslateApiKey = process.env.OPENCLAW_TRANSLATION_API_KEY ?? "";
const coverImageProvider = process.env.OPENCLAW_COVER_IMAGE_PROVIDER ?? "openverse";
const openverseApiUrl = process.env.OPENCLAW_COVER_IMAGE_API_URL ?? "https://api.openverse.org/v1/images/";
const openClawAuthorName = process.env.OPENCLAW_AUTHOR_DISPLAY_NAME ?? "OpenClaw";
const sinceHours = Math.max(1, Number(process.env.OPENCLAW_DISCOVERY_HOURS ?? "24") || 24);
const topLimit = Math.max(1, Number(process.env.OPENCLAW_TOP_LIMIT ?? "5") || 5);

async function main() {
  if (!xblogApiToken) {
    throw new Error("XBLOG_API_TOKEN is required.");
  }

  const runId = `openclaw-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await fs.mkdir(outputDirectory, { recursive: true });

  const [sources, categories] = await Promise.all([loadSources(), fetchCategories()]);
  const discovered = await discoverCandidates(sources);
  const prepared = await prepareCandidates(discovered, categories);
  const groups = groupByTopic(prepared);
  const selected = selectTopArticles(groups, topLimit);
  const published = await publishArticles(selected, runId);

  const report = {
    runId,
    startedAt: new Date().toISOString(),
    sourceCount: sources.length,
    discoveredCount: discovered.length,
    preparedCount: prepared.length,
    selectedCount: selected.length,
    published,
  };

  await fs.writeFile(
    path.join(outputDirectory, `${runId}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify(report, null, 2));
}

async function loadSources() {
  const raw = await fs.readFile(sourceRegistryPath, "utf8");
  return (JSON.parse(raw) as SourceRegistryItem[]).filter((entry) => entry.active);
}

async function fetchCategories() {
  const response = await fetch(`${xblogApiBaseUrl}/v1/public/categories`);
  if (!response.ok) {
    throw new Error(`Unable to fetch categories: ${response.status}`);
  }
  return (await response.json()) as CategorySummary[];
}

async function discoverCandidates(sources: SourceRegistryItem[]) {
  const since = Date.now() - sinceHours * 60 * 60 * 1000;
  const discovered: Array<{ source: SourceRegistryItem; url: string; title: string; publishedAt?: string }> = [];

  for (const source of sources) {
    try {
      if (source.rssUrl) {
        const xml = await fetchText(source.rssUrl);
        for (const item of parseFeedItems(xml)) {
          const publishedAt = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
          if (Number.isFinite(publishedAt) && publishedAt < since) {
            continue;
          }
          if (!item.url || !item.title) {
            continue;
          }
          discovered.push({
            source,
            url: item.url,
            title: item.title,
            publishedAt: item.publishedAt,
          });
        }
        continue;
      }

      const html = await fetchText(source.entryUrl);
      for (const link of extractLinks(html, source)) {
        discovered.push({
          source,
          url: link.url,
          title: link.title,
        });
      }
    } catch (error) {
      console.warn(`[openclaw] failed to discover from ${source.name}:`, error);
    }
  }

  const unique = new Map<string, (typeof discovered)[number]>();
  for (const item of discovered) {
    unique.set(item.url, item);
  }
  return [...unique.values()];
}

async function prepareCandidates(
  discovered: Array<{ source: SourceRegistryItem; url: string; title: string; publishedAt?: string }>,
  categories: CategorySummary[],
) {
  const prepared: CandidateArticle[] = [];

  for (const item of discovered) {
    try {
      const html = await fetchText(item.url);
      const extracted = extractArticleFromHtml(html, item.url, item.title);
      const sanitizedBlocks = sanitizeBlocks(extracted.blocks);
      if (countMeaningfulText(sanitizedBlocks) < 180) {
        continue;
      }

      const originalLanguage = detectLanguage(
        `${extracted.title}\n${sanitizedBlocks.map((block) => block.type === "paragraph" ? block.text : "").join("\n")}`,
      );
      const finalBlocks = await translateBlocksIfNeeded(sanitizedBlocks, originalLanguage);
      if (finalBlocks.length === 0) {
        continue;
      }

      const metadata = await deriveMetadata({
        title: extracted.title,
        blocks: finalBlocks,
        defaultCategory: item.source.defaultCategory,
        categories,
        originalLanguage,
      });
      const coverImageUrl =
        extracted.coverImageUrl ||
        (await resolveCoverImage({
          title: metadata.title,
          categorySlug: metadata.categorySlug ?? item.source.defaultCategory,
          blocks: finalBlocks,
        }));

      const sourceTrail: SourceTrailItem[] = [
        {
          sourceType: item.source.type,
          sourceName: item.source.name,
          sourceUrl: item.url,
          title: extracted.title,
          author: extracted.author ?? null,
          publishedAt: extracted.publishedAt ?? item.publishedAt ?? null,
          language: originalLanguage,
          role: "primary",
        },
      ];

      prepared.push({
        source: item.source,
        sourceUrl: item.url,
        sourceTitle: extracted.title,
        sourceAuthor: extracted.author,
        sourcePublishedAt: extracted.publishedAt ?? item.publishedAt,
        originalLanguage,
        coverImageUrl,
        rawBlocks: extracted.blocks,
        sanitizedBlocks,
        finalBlocks,
        finalTitle: metadata.title,
        finalSlug: createSlug(metadata.title),
        finalExcerpt: metadata.excerpt,
        finalLede: metadata.lede,
        finalReadingTime: estimateReadingTime(finalBlocks),
        finalHighlights: metadata.highlights,
        categorySlug: metadata.categorySlug ?? pickCategorySlug(metadata.title, finalBlocks, categories, item.source.defaultCategory),
        tone: metadata.tone,
        confidenceScore: scoreCandidate(item.source, item.publishedAt, finalBlocks),
        publishMode: "review",
        kind: "CURATED",
        rewriteMode: originalLanguage === "en" ? "single-source-translation-review" : "single-source-curated-review",
        sourceTrail,
        topicFingerprint: createTopicFingerprint(extracted.title),
      });
    } catch (error) {
      console.warn(`[openclaw] failed to prepare ${item.url}:`, error);
    }
  }

  return prepared;
}

function groupByTopic(candidates: CandidateArticle[]) {
  const groups = new Map<string, CandidateArticle[]>();
  for (const candidate of candidates) {
    const key = candidate.topicFingerprint || candidate.finalSlug;
    const current = groups.get(key) ?? [];
    current.push(candidate);
    groups.set(key, current);
  }

  return [...groups.values()].map((group) => group.sort((a, b) => b.confidenceScore - a.confidenceScore));
}

function selectTopArticles(groups: CandidateArticle[][], limit: number) {
  const siteQuota = new Set<string>();
  const selected: CandidateArticle[] = [];

  for (const group of groups.sort((a, b) => b[0].confidenceScore - a[0].confidenceScore)) {
    const distinctSources = new Set(group.map((entry) => entry.source.name));
    const primary = group[0];
    if (siteQuota.has(primary.source.id)) {
      continue;
    }

    if (distinctSources.size >= 2) {
      const merged = mergeGroup(group);
      if (merged) {
        selected.push(merged);
        siteQuota.add(primary.source.id);
      }
    } else {
      selected.push({
        ...primary,
        publishMode: "review",
        kind: "CURATED",
      });
      siteQuota.add(primary.source.id);
    }

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function mergeGroup(group: CandidateArticle[]) {
  const primary = group[0];
  const combinedText = group
    .slice(0, 3)
    .map((entry) => `来源：${entry.source.name}\n标题：${entry.finalTitle}\n${blocksToPlainText(entry.finalBlocks).slice(0, 1000)}`)
    .join("\n\n");

  const summary = buildFallbackMetadata(`多源综合：${primary.finalTitle}`, combinedText);
  const mergedBlocks = markdownToBlocks(
    `## 发生了什么\n${summary.lede}\n\n## 关键信号\n${summary.highlights.map((item) => `- ${item}`).join("\n")}\n\n## 主要观察\n${combinedText.slice(0, 1600)}`,
  );
  const imageBlocks = primary.finalBlocks.filter((block) => block.type === "image").slice(0, 2);

  return {
    ...primary,
    finalTitle: summary.title,
    finalSlug: createSlug(summary.title),
    finalExcerpt: summary.excerpt,
    finalLede: summary.lede,
    finalHighlights: summary.highlights,
    finalBlocks: interleaveImages(mergedBlocks, imageBlocks),
    finalReadingTime: estimateReadingTime(mergedBlocks),
    kind: "ORIGINAL",
    publishMode: primary.confidenceScore >= 0.85 ? "auto" : "review",
    rewriteMode: "multi-source-original",
    sourceTrail: group.slice(0, 3).map((entry, index) => ({
      ...entry.sourceTrail[0],
      role: index === 0 ? "primary" : "supporting",
    })),
    confidenceScore: Math.min(1, primary.confidenceScore + 0.08),
  };
}

async function publishArticles(candidates: CandidateArticle[], runId: string) {
  const results: Array<Record<string, unknown>> = [];

  for (const candidate of candidates) {
    const payload: IngestArticleRequest = {
      externalId: `${candidate.source.id}:${candidate.finalSlug}`,
      kind: candidate.kind,
      publishMode: candidate.publishMode,
      title: candidate.finalTitle,
      slug: candidate.finalSlug,
      excerpt: candidate.finalExcerpt,
      lede: candidate.finalLede,
      tone: candidate.tone,
      categorySlug: candidate.categorySlug || fallbackCategorySlug,
      readingTime: candidate.finalReadingTime,
      authorDisplayName: openClawAuthorName,
      authorRoleLabel: defaultAuthorRoleLabel,
      highlights: candidate.finalHighlights,
      blocks: candidate.finalBlocks,
      coverImage: candidate.coverImageUrl ? { sourceUrl: candidate.coverImageUrl, alt: candidate.finalTitle } : null,
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      sourceAuthor: candidate.sourceAuthor,
      sourcePublishedAt: candidate.sourcePublishedAt,
      publishedAt: candidate.publishMode === "auto" ? new Date().toISOString() : undefined,
      ingestSource: candidate.source.name,
      ingestScore: candidate.confidenceScore,
      originalLanguage: candidate.originalLanguage,
      rewriteMode: candidate.rewriteMode,
      sourceTrail: candidate.sourceTrail,
    };

    const response = await fetch(`${xblogApiBaseUrl}/v1/ingest/articles`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${xblogApiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    results.push({
      title: candidate.finalTitle,
      sourceUrl: candidate.sourceUrl,
      statusCode: response.status,
      response: body,
      publishMode: candidate.publishMode,
      kind: candidate.kind,
      runId,
    });
  }

  return results;
}

async function resolveCoverImage(input: {
  title: string;
  categorySlug: string;
  blocks: ArticleBlock[];
}) {
  if (coverImageProvider !== "openverse") {
    return null;
  }

  const query = encodeURIComponent(buildCoverQuery(input.title, input.categorySlug, input.blocks));
  const response = await fetch(`${openverseApiUrl}?q=${query}&page_size=6&license_type=commercial,commercial_modification`);
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    results?: Array<{
      url?: string;
      width?: number | null;
      height?: number | null;
      mature?: boolean;
    }>;
  };
  const candidates = payload.results ?? [];
  const preferred = candidates.find(
    (entry) => entry.url && !entry.mature && typeof entry.width === "number" && typeof entry.height === "number" && entry.width >= entry.height,
  );
  return preferred?.url ?? candidates.find((entry) => entry.url && !entry.mature)?.url ?? null;
}

async function translateBlocksIfNeeded(blocks: ArticleBlock[], language: "zh" | "en") {
  if (language === "zh") {
    return blocks;
  }

  const textPayload = blocks.map((block) => {
    if (block.type === "paragraph" || block.type === "quote") {
      return block.text;
    }
    if (block.type === "heading") {
      return block.text;
    }
    if (block.type === "list") {
      return block.items.join("\n");
    }
    if (block.type === "image") {
      return `${block.alt}\n${block.caption}`;
    }
    return "";
  });

  const translated =
    translationProvider === "libretranslate"
      ? await libreTranslateBatch(textPayload)
      : openAiApiKey
        ? await openAiJson<string[]>({
            system: "You translate technical content from English into concise natural Chinese. Preserve product names, API names, file paths, versions, and code terms.",
            user: JSON.stringify(textPayload),
          })
        : [];

  if (!Array.isArray(translated) || translated.length !== blocks.length) {
    return [];
  }

  return blocks.map((block, index) => {
    const value = translated[index] ?? "";
    if (block.type === "paragraph") {
      return { ...block, text: value || block.text };
    }
    if (block.type === "quote") {
      return { ...block, text: value || block.text };
    }
    if (block.type === "heading") {
      return { ...block, text: value || block.text };
    }
    if (block.type === "list") {
      return { ...block, items: value.split("\n").map((item) => item.trim()).filter(Boolean) };
    }
    if (block.type === "image") {
      const [alt, ...rest] = value.split("\n");
      return { ...block, alt: alt?.trim() || block.alt, caption: rest.join("\n").trim() || block.caption };
    }
    return block;
  });
}

async function deriveMetadata(input: {
  title: string;
  blocks: ArticleBlock[];
  defaultCategory: string;
  categories: CategorySummary[];
  originalLanguage: "zh" | "en";
}): Promise<MetadataResult> {
  const plainText = blocksToPlainText(input.blocks).slice(0, 4000);
  if (openAiApiKey) {
    const result = await openAiJson<MetadataResult>({
      system:
        "You are a Chinese technical editor. Return JSON with title, excerpt, lede, highlights, tone, and optional categorySlug. Title must be concise, non-clickbait, and information dense.",
      user: JSON.stringify({
        sourceTitle: input.title,
        body: plainText,
        availableCategories: input.categories.map((entry) => ({
          slug: entry.slug,
          name: entry.name,
          focusAreas: entry.focusAreas,
        })),
      }),
    });

    if (result && typeof result.title === "string" && typeof result.excerpt === "string" && typeof result.lede === "string") {
      return {
        title: result.title.trim(),
        excerpt: result.excerpt.trim(),
        lede: result.lede.trim(),
        highlights: Array.isArray(result.highlights) ? result.highlights.slice(0, 4).map((entry) => entry.trim()).filter(Boolean) : [],
        tone: result.tone ?? defaultTone,
        categorySlug: result.categorySlug,
      };
    }
  }

  return buildFallbackMetadata(input.title, plainText, input.defaultCategory);
}

function buildFallbackMetadata(sourceTitle: string, plainText: string, categorySlug?: string): MetadataResult {
  const sentences = splitSentences(plainText).filter((entry) => entry.length > 16);
  const title = cleanupTitle(sourceTitle);
  return {
    title,
    excerpt: sentences[0] ?? `${title}，聚焦技术变化与可执行要点。`,
    lede: sentences.slice(0, 2).join(" ") || `${title}，这篇稿件聚焦技术变化、实现方式与实际影响。`,
    highlights: sentences.slice(0, 3),
    tone: inferTone(title, plainText),
    categorySlug,
  };
}

function cleanupTitle(title: string) {
  return title
    .replace(/\s+/g, " ")
    .replace(/(赞助|广告|立即报名|点击阅读原文).*/g, "")
    .trim()
    .slice(0, 32) || "今日技术观察";
}

function sanitizeBlocks(blocks: ArticleBlock[]) {
  return blocks.filter((block) => classifyBlock(block) === "content");
}

function classifyBlock(block: ArticleBlock) {
  const text =
    block.type === "paragraph"
      ? block.text
      : block.type === "heading"
        ? block.text
        : block.type === "quote"
          ? block.text
          : block.type === "list"
            ? block.items.join(" ")
            : block.type === "image"
              ? `${block.alt} ${block.caption}`
              : "";

  const patternMap: Array<[string, RegExp]> = [
    ["cta", /(扫码|加群|私信|关注公众号|点击阅读原文|立即报名|加入社群|联系客服)/i],
    ["ad", /(赞助|推广|广告|课程|训练营|限时优惠|品牌合作)/i],
    ["related-links", /(猜你喜欢|相关阅读|延伸阅读|更多推荐|推荐阅读)/i],
    ["boilerplate", /(本文转载|版权归原作者|免责声明|本文来自|欢迎转载)/i],
  ];

  for (const [label, pattern] of patternMap) {
    if (pattern.test(text)) {
      return label;
    }
  }

  if (block.type === "divider") {
    return "unknown";
  }
  return "content";
}

function extractArticleFromHtml(html: string, url: string, fallbackTitle: string): ExtractedArticle {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const title = decodeEntities(
    matchMeta(cleaned, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
      matchTag(cleaned, "title") ??
      fallbackTitle,
  );
  const author = decodeEntities(
    matchMeta(cleaned, /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ?? "",
  ) || undefined;
  const publishedAt =
    matchMeta(cleaned, /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i) ??
    matchMeta(cleaned, /<time[^>]+datetime=["']([^"']+)["']/i) ??
    undefined;
  const coverImageUrl = absolutizeUrl(
    url,
    matchMeta(cleaned, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ?? "",
  );
  const bodyHtml =
    matchTag(cleaned, "article") ??
    matchMeta(cleaned, /<main[^>]*>([\s\S]*?)<\/main>/i) ??
    matchMeta(cleaned, /<body[^>]*>([\s\S]*?)<\/body>/i) ??
    cleaned;

  const blocks = htmlToBlocks(bodyHtml, url);
  return {
    title,
    author,
    publishedAt,
    coverImageUrl,
    blocks,
  };
}

function htmlToBlocks(html: string, baseUrl: string) {
  const blocks: ArticleBlock[] = [];
  const tokenPattern = /<(h2|h3|p|li|img)[^>]*?(?:src=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/\1>|<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(tokenPattern)) {
    const tag = match[1] ?? "img";
    if (tag === "img") {
      const src = absolutizeUrl(baseUrl, match[4] ?? match[2] ?? "");
      if (src) {
        blocks.push({
          id: randomUUID(),
          type: "image",
          url: src,
          alt: "",
          caption: "",
        });
      }
      continue;
    }

    const text = decodeEntities(stripHtml(match[3] ?? "").trim());
    if (!text) {
      continue;
    }
    if (tag === "h2" || tag === "h3") {
      blocks.push({
        id: randomUUID(),
        type: "heading",
        level: tag === "h2" ? 2 : 3,
        text,
      });
      continue;
    }
    if (tag === "li") {
      const previous = blocks.at(-1);
      if (previous?.type === "list" && previous.style === "bullet") {
        previous.items.push(text);
      } else {
        blocks.push({
          id: randomUUID(),
          type: "list",
          style: "bullet",
          items: [text],
        });
      }
      continue;
    }
    blocks.push({
      id: randomUUID(),
      type: "paragraph",
      text,
    });
  }

  return blocks;
}

function interleaveImages(blocks: ArticleBlock[], imageBlocks: ArticleBlock[]) {
  if (imageBlocks.length === 0) {
    return blocks;
  }
  const result = [...blocks];
  result.splice(Math.min(2, result.length), 0, ...imageBlocks);
  return result;
}

function markdownToBlocks(markdown: string) {
  const blocks: ArticleBlock[] = [];
  for (const section of markdown.split(/\n{2,}/)) {
    const value = section.trim();
    if (!value) {
      continue;
    }
    if (value.startsWith("## ")) {
      blocks.push({
        id: randomUUID(),
        type: "heading",
        level: 2,
        text: value.replace(/^## /, "").trim(),
      });
      continue;
    }
    if (value.startsWith("- ")) {
      blocks.push({
        id: randomUUID(),
        type: "list",
        style: "bullet",
        items: value.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean),
      });
      continue;
    }
    blocks.push({
      id: randomUUID(),
      type: "paragraph",
      text: value,
    });
  }
  return blocks;
}

function countMeaningfulText(blocks: ArticleBlock[]) {
  return blocksToPlainText(blocks).replace(/\s+/g, "").length;
}

function blocksToPlainText(blocks: ArticleBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
        return block.text;
      }
      if (block.type === "list") {
        return block.items.join(" ");
      }
      if (block.type === "code") {
        return "";
      }
      if (block.type === "image") {
        return `${block.alt} ${block.caption}`.trim();
      }
      return "";
    })
    .join("\n");
}

function createTopicFingerprint(title: string) {
  const normalized = createSlug(title);
  const tokens = normalized.split("-").filter((token) => token.length > 3);
  return tokens.slice(0, 3).join("-") || normalized;
}

function scoreCandidate(source: SourceRegistryItem, publishedAt: string | undefined, blocks: ArticleBlock[]) {
  const freshness = publishedAt ? Math.max(0, 1 - (Date.now() - Date.parse(publishedAt)) / (36 * 60 * 60 * 1000)) : 0.4;
  const technicalDepth = Math.min(1, countMeaningfulText(blocks) / 3200);
  const structure = Math.min(1, blocks.filter((block) => block.type === "heading" || block.type === "list" || block.type === "code").length / 10);
  return Math.min(1, source.priorityWeight * 0.45 + freshness * 0.3 + technicalDepth * 0.15 + structure * 0.1);
}

function estimateReadingTime(blocks: ArticleBlock[]) {
  const count = Math.max(1, Math.ceil(countMeaningfulText(blocks) / 330));
  return `${count} 分钟`;
}

function pickCategorySlug(title: string, blocks: ArticleBlock[], categories: CategorySummary[], fallback: string) {
  const haystack = `${title}\n${blocksToPlainText(blocks)}`.toLowerCase();
  const matched = categories
    .map((entry) => ({
      slug: entry.slug,
      score: [entry.slug, entry.name, ...entry.focusAreas].reduce(
        (score, token) => (haystack.includes(String(token).toLowerCase()) ? score + 1 : score),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)[0];
  return matched?.score ? matched.slug : fallback || fallbackCategorySlug;
}

function inferTone(title: string, plainText: string): CandidateArticle["tone"] {
  const haystack = `${title} ${plainText}`.toLowerCase();
  if (/(design|ui|frontend|交互|界面)/i.test(haystack)) {
    return "pink";
  }
  if (/(infra|system|distributed|architecture|系统|架构|网络)/i.test(haystack)) {
    return "blue";
  }
  if (/(tool|workflow|efficiency|工具|工程效率)/i.test(haystack)) {
    return "green";
  }
  return defaultTone;
}

function buildCoverQuery(title: string, categorySlug: string, blocks: ArticleBlock[]) {
  const plainText = blocksToPlainText(blocks).toLowerCase();
  const titleHint = title.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();

  if (/(agent|model|llm|ai|智能体|模型)/i.test(`${title} ${plainText}`) || categorySlug === "ai-agent") {
    return `${titleHint} artificial intelligence`;
  }

  if (/(system|infra|distributed|network|云|架构|分布式)/i.test(`${title} ${plainText}`) || categorySlug === "systems-design") {
    return `${titleHint} infrastructure`;
  }

  if (/(frontend|ui|ux|design|界面|交互)/i.test(`${title} ${plainText}`) || categorySlug === "frontend-interaction") {
    return `${titleHint} interface design`;
  }

  return `${titleHint} technology`;
}

function detectLanguage(text: string) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return cjk >= latin ? "zh" : "en";
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[。！？.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function extractLinks(html: string, source: SourceRegistryItem) {
  const results: Array<{ url: string; title: string }> = [];
  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = absolutizeUrl(source.entryUrl, match[1] ?? "");
    const title = decodeEntities(stripHtml(match[2] ?? "").trim());
    if (!url || !title || title.length < 12) {
      continue;
    }
    results.push({ url, title });
  }
  return results.slice(0, 20);
}

function parseFeedItems(xml: string) {
  const items: Array<{ title?: string; url?: string; publishedAt?: string }> = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const body = match[1] ?? "";
    items.push({
      title: decodeEntities(matchMeta(body, /<title>([\s\S]*?)<\/title>/i) ?? ""),
      url: decodeEntities(matchMeta(body, /<link>([\s\S]*?)<\/link>/i) ?? ""),
      publishedAt: matchMeta(body, /<pubDate>([\s\S]*?)<\/pubDate>/i) ?? undefined,
    });
  }
  if (items.length > 0) {
    return items;
  }
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
    const body = match[1] ?? "";
    items.push({
      title: decodeEntities(matchMeta(body, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? ""),
      url: decodeEntities(matchMeta(body, /<link[^>]+href=["']([^"']+)["']/i) ?? ""),
      publishedAt: matchMeta(body, /<updated>([\s\S]*?)<\/updated>/i) ?? undefined,
    });
  }
  return items;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "OpenClaw-XBlog/1.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function openAiJson<T>(input: { system: string; user: string }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

async function libreTranslateBatch(textPayload: string[]) {
  if (!libreTranslateApiUrl) {
    return [];
  }

  const translated: string[] = [];
  for (const text of textPayload) {
    if (!text.trim()) {
      translated.push("");
      continue;
    }

    const response = await fetch(libreTranslateApiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "zh",
        format: "text",
        api_key: libreTranslateApiKey || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate request failed: ${response.status}`);
    }

    const payload = (await response.json()) as { translatedText?: string };
    translated.push(payload.translatedText ?? "");
  }

  return translated;
}

function matchMeta(input: string, pattern: RegExp) {
  return input.match(pattern)?.[1]?.trim();
}

function matchTag(input: string, tagName: string) {
  return input.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"))?.[1]?.trim();
}

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ");
}

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function absolutizeUrl(baseUrl: string, target: string) {
  if (!target) {
    return "";
  }
  try {
    return new URL(target, baseUrl).toString();
  } catch {
    return "";
  }
}

void main().catch((error) => {
  console.error("[openclaw] fatal:", error);
  process.exitCode = 1;
});
