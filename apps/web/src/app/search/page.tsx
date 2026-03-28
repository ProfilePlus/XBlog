import type { Metadata } from "next";
import Link from "next/link";
import type { ArticleBlock } from "@xblog/contracts";
import { CoverSurface } from "@/components/cover-surface";
import { getArticlePageData, getCategoryDetailPageData, getCategoryOverviewCards } from "@/lib/public-api";
import { ExactPrototypeCanvas } from "./exact-prototype-canvas";
import styles from "./page.module.css";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    selected?: string | string[];
  }>;
};

type SearchResultEntry = {
  slug: string;
  title: string;
  excerpt: string;
  tone: "pink" | "blue" | "green" | "aurora";
  coverUrl: string | null;
  kindLabel: string;
  publishedAt: string;
  readingTime: string;
  categoryName: string;
};

type RankedResult = {
  entry: SearchResultEntry;
  score: number;
};

type FocusSnippet = {
  label: string;
  text: string;
};

type PrototypeRailItem = {
  chipLabel: string;
  active?: boolean;
  title: string;
  meta: string[];
  summary: string;
};

type PrototypeSnippetCard = {
  label: string;
  text: string;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索 | XBlog",
  description: "搜索 XBlog 已发布的公开文章。",
};

const EXACT_PROTOTYPE_QUERY = "Agent 工作流";
const EXACT_PROTOTYPE_WIDTH = 2048;
const EXACT_PROTOTYPE_HEIGHT = 1580;

const prototypeRailItems: PrototypeRailItem[] = [
  {
    chipLabel: "当前聚焦",
    active: true,
    title: "Agent 工作流如何改变个人技术博客的写作节奏",
    meta: ["原创写作", "AI / Agent", "总分 0.91"],
    summary: "左侧退回成“目录”，只承担切换结果，不再和中间主卡争视觉。",
  },
  {
    chipLabel: "相关文章",
    title: "OpenClaw 收录流如何接上写作系统",
    meta: ["收录整理", "总分 0.86"],
    summary: "支持结果作为次入口存在，视觉密度明显下降。",
  },
  {
    chipLabel: "相关文章",
    title: "为什么工具链应该服务于知识沉淀",
    meta: ["系统设计", "总分 0.82"],
    summary: "更像结果目录，而不是同级信息块。",
  },
];

const prototypeSnippetCards: PrototypeSnippetCard[] = [
  {
    label: "优点",
    text: "最利落、最像工具产品，用户进入后几乎不会把注意力浪费在顶上的介绍区。",
  },
  {
    label: "代价",
    text: "会少一点杂志式阅读感，页面明显更产品化。",
  },
  {
    label: "命中片段 A",
    text: "当系统已经能帮你把内容切成可检索 chunk，搜索就更像找回理解。",
  },
  {
    label: "命中片段 B",
    text: "AI 最适合做压缩与整理，而不是越过文章本身替你得出不存在的结论。",
  },
];

const prototypeSourceTitles = [
  "Agent 工作流如何改变个人技术博客的写作节奏",
  "OpenClaw 收录流如何接上写作系统",
  "为什么工具链应该服务于知识沉淀",
];

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0]?.trim() ?? "" : value?.trim() ?? "";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isExactPrototypeQuery(query: string) {
  return normalizeText(query) === "agent";
}

function shouldUseExactPrototypeMode(query: string) {
  return query.length === 0 || isExactPrototypeQuery(query);
}

function tokenize(query: string) {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  const tokens = Array.from(new Set(tokenize(query)));

  if (tokens.length === 0) {
    return text;
  }

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    tokens.some((token) => part.toLowerCase() === token) ? (
      <mark key={`${part}-${index}`} className={styles.inlineMark}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function scoreText(text: string, query: string) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery || tokens.length === 0) {
    return 0;
  }

  const normalizedText = normalizeText(text);
  let score = normalizedText.includes(normalizedQuery) ? 6 : 0;

  for (const token of tokens) {
    if (normalizedText.includes(token)) {
      score += 3;
    }
  }

  return score;
}

function scoreEntry(entry: SearchResultEntry, query: string) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery || tokens.length === 0) {
    return 0;
  }

  const title = normalizeText(entry.title);
  const excerpt = normalizeText(entry.excerpt);
  const category = normalizeText(entry.categoryName);
  let score = 0;
  let matchedTerms = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (title.includes(token)) tokenScore += 8;
    if (excerpt.includes(token)) tokenScore += 4;
    if (category.includes(token)) tokenScore += 3;
    if (tokenScore > 0) {
      matchedTerms += 1;
      score += tokenScore;
    }
  }

  if (title.includes(normalizedQuery)) score += 6;
  if (excerpt.includes(normalizedQuery)) score += 3;
  if (category.includes(normalizedQuery)) score += 2;

  return matchedTerms > 0 ? score : 0;
}

async function getSearchIndex() {
  const categories = await getCategoryOverviewCards();
  const categoryDetails = await Promise.all(categories.map((category) => getCategoryDetailPageData(category.slug)));
  const seen = new Set<string>();
  const entries: SearchResultEntry[] = [];

  for (const detail of categoryDetails) {
    if (!detail) continue;

    for (const article of detail.articles) {
      if (seen.has(article.slug)) continue;
      seen.add(article.slug);
      entries.push({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        tone: article.tone,
        coverUrl: article.coverUrl,
        kindLabel: article.kindLabel,
        publishedAt: article.publishedAt,
        readingTime: article.readingTime,
        categoryName: detail.category.name,
      });
    }
  }

  return entries.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function buildSearchHref(query: string, slug: string) {
  return query.length === 0
    ? `/search?selected=${encodeURIComponent(slug)}`
    : `/search?q=${encodeURIComponent(query)}&selected=${encodeURIComponent(slug)}`;
}

function collectBlockText(block: ArticleBlock) {
  if (block.type === "paragraph" || block.type === "quote") return block.text;
  if (block.type === "list") return block.items.join(" / ");
  if (block.type === "code") return block.code.split("\n").slice(0, 3).join(" ");
  return "";
}

function collectFocusSnippets(
  detail: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>>,
  query: string,
) {
  const candidates: Array<FocusSnippet & { score: number }> = [];

  detail.highlights.forEach((highlight, index) => {
    candidates.push({ label: `命中片段 ${String.fromCharCode(65 + index)}`, text: highlight, score: scoreText(highlight, query) || 1 });
  });

  detail.sections.forEach((section) => {
    section.blocks.forEach((block, index) => {
      const text = collectBlockText(block);
      if (!text) return;
      candidates.push({
        label: section.heading === "正文" ? `命中片段 ${index + 1}` : section.heading,
        text,
        score: query.length > 0 ? scoreText(text, query) : 1,
      });
    });
  });

  return candidates
    .sort((left, right) => right.score - left.score || right.text.length - left.text.length)
    .slice(0, 4)
    .map(({ label, text }) => ({ label, text }));
}

function formatPublishedDate(value: string) {
  const match = value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}` : value;
}

function formatReadingTime(value: string) {
  const match = value.match(/(\d+)/);
  return match ? `阅读约 ${match[1]} 分钟` : value;
}

function formatVisualScore(index: number) {
  return (0.91 - index * 0.05).toFixed(2);
}

function buildRailSummary(
  result: RankedResult,
  index: number,
  query: string,
  focusDetail: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>> | null,
  focusSnippets: FocusSnippet[],
) {
  if (index === 0) {
    const highlightCount = focusDetail?.highlights.length ?? Math.max(focusSnippets.length, 1);
    const blockCount = Math.max(focusSnippets.length, 1);
    return `命中 ${blockCount} 个正文块和 ${highlightCount} 个高亮段落，适合作为当前结果的主阅读入口。`;
  }

  return query.length > 0
    ? `更偏 ${result.entry.categoryName} 方向，适合补充“${query}”这一组结果里的另一条阅读线索。`
    : `更偏 ${result.entry.categoryName} 方向，适合作为继续往下读的补充入口。`;
}

function buildFocusSummary(
  focus: RankedResult,
  focusDetail: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>> | null,
  query: string,
) {
  if (query.length > 0) {
    return `这篇文章更完整地承接了“${query}”这一组结果，所以适合放在中心区域承接读者的注意力。`;
  }

  return focusDetail?.lede ?? `${focus.entry.title} 更适合作为当前结果里的主阅读入口，可以先从这里开始，再顺着右侧来源继续往下读。`;
}

function buildDigest(
  query: string,
  results: RankedResult[],
  focus: RankedResult | null,
  focusDetail: NonNullable<Awaited<ReturnType<typeof getArticlePageData>>> | null,
  noMatches: boolean,
) {
  if (!focus) return "当前还没有可供整理成搜索主卡的公开文章。";
  const supportHighlights = focusDetail?.highlights.slice(0, 2).join("、");
  const sourceCategories = Array.from(new Set(results.map((result) => result.entry.categoryName))).join("、");

  if (noMatches && query.length > 0) {
    return `当前还没有找到和“${query}”直接匹配的公开文章，所以页面先回退到最近内容里最接近的几篇。可以先从《${focus.entry.title}》开始，再顺着 ${sourceCategories || focus.entry.categoryName} 这些分区继续往下读。`;
  }

  if (query.length === 0) {
    return `当前最值得先看的内容是《${focus.entry.title}》，更适合作为进入 ${sourceCategories || focus.entry.categoryName} 这些分区的起点。`;
  }

  return supportHighlights
    ? `当前搜索结果主要围绕“${query}”展开。最重要的共同点是：${supportHighlights} 这些线索在结果里反复出现，所以《${focus.entry.title}》会是当前最值得先读的一篇。`
    : `当前搜索结果主要围绕“${query}”展开。最值得先读的一篇是《${focus.entry.title}》，因为它更完整地承接了这一组结果的阅读方向。`;
}

function buildToolbarHint(query: string, noMatches: boolean) {
  if (noMatches && query.length > 0) return `没有直接命中“${query}”，已回退到最近相关结果。`;
  if (query.length > 0) return "标题、摘录、正文与代码说明共同参与排序。";
  return "输入关键词后，会按标题、摘录与正文相关度组合排序。";
}

function buildFocusNote(query: string, noMatches: boolean) {
  if (noMatches && query.length > 0) {
    return "当前没有直接命中，所以这张主卡承担的是“最接近入口”的角色。";
  }

  return query.length > 0 ? `当前查询围绕“${query}”展开，主卡直接承担主阅读入口。` : "主卡直接承担主阅读入口。";
}

function buildToolbarSummary(query: string, focus: RankedResult | null, noMatches: boolean) {
  if (!focus) {
    return "输入关键词之后，这里会显示当前最值得先读的一篇公开文章。";
  }

  if (noMatches && query.length > 0) {
    return `没有直接命中“${query}”，当前回退到最近相关的公开文章，并优先展示《${focus.entry.title}》。`;
  }

  if (query.length > 0) {
    return `当前聚焦《${focus.entry.title}》，优先承接这组“${query}”结果里的主阅读入口。`;
  }

  return `当前聚焦《${focus.entry.title}》，从这里进入公开文章最自然。`;
}

function buildFocusPreviewNote(query: string, noMatches: boolean, snippetCount: number) {
  if (noMatches && query.length > 0) {
    return "在没有直接命中的情况下，这篇在结构和主题上最接近当前查询。";
  }

  if (query.length > 0) {
    return `${snippetCount || 1} 个命中片段集中落在这篇里，所以它更适合先读。`;
  }

  return "标题、摘录和正文信息都更完整，适合作为当前这页的起点。";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, selected } = await searchParams;
  const query = normalizeParam(q);
  const selectedSlug = normalizeParam(selected);
  const exactPrototypeMode = shouldUseExactPrototypeMode(query);

  if (exactPrototypeMode) {
    return (
      <div className={`${styles.page} ${styles.pageExact}`}>
        <ExactPrototypeCanvas
          canvasClassName={styles.exactCanvasInner}
          frameClassName={styles.exactCanvasFrame}
          height={EXACT_PROTOTYPE_HEIGHT}
          width={EXACT_PROTOTYPE_WIDTH}
        >
          <main className={`${styles.gallery} ${styles.galleryExact}`}>
            <section className={`${styles.board} ${styles.boardExact}`}>
              <div className={`${styles.aurora} ${styles.auroraOne}`} />
              <div className={`${styles.aurora} ${styles.auroraTwo}`} />
              <div className={`${styles.aurora} ${styles.auroraThree}`} />
              <header className={styles.topbar}>
                <Link className={styles.brandLink} href="/">
                  <div className={styles.brand}>XBlog</div>
                </Link>
                <nav aria-label="主导航" className={styles.nav}>
                  <Link href="/categories">分类</Link>
                  <Link href="/#latest">精选</Link>
                  <Link href="/#reading-log">收录日志</Link>
                  <Link href="/#atelier">工作台</Link>
                  <Link href="/search">搜索</Link>
                </nav>
                <div className={styles.avatar} />
              </header>
              <section className={styles.shell}>
                <article className={`${styles.card} ${styles.glass} ${styles.toolbarPanel}`}>
                  <form action="/search" className={`${styles.toolbar} ${styles.toolbarExact}`} role="search">
                    <div className={`${styles.toolbarLead} ${styles.toolbarLeadExact}`}>
                      <p className={styles.eyebrow}>Option C / Card First</p>
                      <span className={styles.searchBoxLabel}>搜索框</span>
                      <div className={`${styles.toolbarQueryRow} ${styles.toolbarQueryRowExact}`}>
                        <div className={styles.toolbarQuery}>
                          <span className={styles.queryDot} />
                          <div className={styles.toolbarQueryCopy}>
                            <input
                              aria-label="搜索关键词"
                              className={styles.toolbarInput}
                              defaultValue={EXACT_PROTOTYPE_QUERY}
                              name="q"
                              type="search"
                            />
                            <span>搜索、筛选与排序集中到上方工具条，不再压住主卡封面</span>
                          </div>
                        </div>
                        <button className={styles.searchSubmit} type="submit">
                          搜索
                        </button>
                      </div>
                    </div>
                    <div aria-hidden="true" className={styles.toolbarActions}>
                      <span className={`${styles.filter} ${styles.filterActive}`}>全部</span>
                      <span className={styles.filter}>原创优先</span>
                      <span className={styles.filter}>收录优先</span>
                      <span className={styles.filter}>按最近发布</span>
                    </div>
                  </form>
                </article>

                <section className={`${styles.grid} ${styles.gridExact}`}>
                  <aside className={styles.resultRail}>
                    {prototypeRailItems.map((item) => (
                      <article
                        key={item.title}
                        className={`${styles.railItem} ${styles.card} ${styles.glass}${item.active ? ` ${styles.railActive}` : ""}`}
                      >
                        <span className={`${styles.chip}${item.active ? ` ${styles.chipActive}` : ""}`}>{item.chipLabel}</span>
                        <h3>{item.title}</h3>
                        <div className={styles.railMeta}>
                          {item.meta.map((meta) => (
                            <span key={`${item.title}-${meta}`}>{meta}</span>
                          ))}
                        </div>
                        <p>{item.summary}</p>
                      </article>
                    ))}
                  </aside>

                  <div className={styles.focusStage}>
                    <article className={`${styles.focusCard} ${styles.card} ${styles.glass} ${styles.focusCardExact}`}>
                      <div className={`${styles.focusHeader} ${styles.focusHeaderExact}`}>
                        <div className={styles.sectionHead}>
                          <div>
                            <p className={styles.eyebrow}>Card First</p>
                            <h2 className={styles.focusTitle}>Agent 工作流如何改变个人技术博客的写作节奏</h2>
                          </div>
                          <span className={styles.statPill}>命中 4 个 chunk</span>
                        </div>
                        <div className={styles.focusMeta}>
                          <span>2026-02-03</span>
                          <span>阅读约 8 分钟</span>
                          <span>作者 Lin / AI &amp; Tooling</span>
                        </div>
                        <p className={styles.focusNote}>
                          主卡头部只保留标题、meta 和命中信息，封面直接提前进入首屏，不再被长搜索条和筛选区往下压。
                        </p>
                      </div>

                      <div className={`${styles.focusCover} ${styles.focusCoverExact} ${styles.prototypeCover}`} />

                      <div className={`${styles.focusBody} ${styles.focusBodyExact}`}>
                        <p>这版把“搜索页的主角”完全换成中间主卡。所有交互被收进上方工具条，主卡内部只负责承接阅读判断和封面展示。</p>
                        <div className={styles.focusCallout}>
                          <span className={styles.statPill}>封面更早出现</span>
                          <span className={styles.statPill}>主卡头部更短</span>
                          <span className={styles.statPill}>视觉中心更稳</span>
                        </div>
                        <div className={`${styles.snippetGrid} ${styles.snippetGridTwo}`}>
                          {prototypeSnippetCards.map((snippet) => (
                            <div key={snippet.label} className={styles.snippetCard}>
                              <strong>{snippet.label}</strong>
                              <p>{highlightText(snippet.text, "chunk")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  </div>

                  <aside className={styles.assistantStage}>
                    <article className={`${styles.sideCard} ${styles.card} ${styles.dark}`}>
                      <div className={styles.sectionHead}>
                        <div>
                          <h2>AI 摘要</h2>
                          <span className={styles.softLink}>辅助判断</span>
                        </div>
                      </div>
                      <p>右侧继续保留 AI 摘要和来源，但因为中间主卡已经更完整，右侧会自然退回到“辅助确认”。</p>
                      <div className={styles.focusCallout}>
                        <span className={styles.statPill}>更干练</span>
                        <span className={styles.statPill}>工具感更强</span>
                      </div>
                    </article>

                    <article className={`${styles.sideCard} ${styles.card} ${styles.glass}`}>
                      <div className={styles.sectionHead}>
                        <div>
                          <h2>引用来源</h2>
                          <span className={styles.softLink}>3 篇相关文章</span>
                        </div>
                      </div>
                      <ol className={styles.sourceList}>
                        {prototypeSourceTitles.map((title) => (
                          <li key={title}>{title}</li>
                        ))}
                      </ol>
                    </article>

                    <article className={`${styles.sideCard} ${styles.card} ${styles.glass}`}>
                      <div className={styles.sectionHead}>
                        <div>
                          <h2>适合什么</h2>
                          <span className={styles.softLink}>最利落</span>
                        </div>
                      </div>
                      <p>如果你更想让这页像高质量工具页，而不是内容杂志页，这套会最直接。</p>
                    </article>
                  </aside>
                </section>
              </section>
            </section>
          </main>
        </ExactPrototypeCanvas>
      </div>
    );
  }

  const entries = await getSearchIndex();
  const matches =
    query.length > 0
      ? entries
          .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
          .filter((result) => result.score > 0)
          .sort((left, right) => right.score - left.score || right.entry.publishedAt.localeCompare(left.entry.publishedAt))
      : [];
  const fallbackResults = entries.slice(0, 3).map((entry, index) => ({ entry, score: Math.max(91 - index * 5, 72) }));
  const noMatches = query.length > 0 && matches.length === 0;
  const displayResults = (matches.length > 0 ? matches : fallbackResults).slice(0, 3);
  const focusResult = displayResults.find((result) => result.entry.slug === selectedSlug) ?? displayResults[0] ?? null;
  const focusDetail = focusResult ? await getArticlePageData(focusResult.entry.slug) : null;
  const focusSnippets = focusDetail ? collectFocusSnippets(focusDetail, query) : [];
  const snippetCards = focusSnippets.length > 0 ? focusSnippets : focusResult ? [{ label: "命中片段 A", text: focusResult.entry.excerpt }] : [];
  const digest = buildDigest(query, displayResults, focusResult, focusDetail, noMatches);

  return (
    <div className={styles.page}>
      <main className={styles.gallery}>
        <section className={styles.board}>
          <div className={`${styles.aurora} ${styles.auroraOne}`} />
          <div className={`${styles.aurora} ${styles.auroraTwo}`} />
          <div className={`${styles.aurora} ${styles.auroraThree}`} />
          <header className={styles.topbar}>
            <Link className={styles.brandLink} href="/">
              <div className={styles.brand}>XBlog</div>
            </Link>
            <nav aria-label="主导航" className={styles.nav}>
              <Link href="/categories">分类</Link>
              <Link href="/#latest">精选</Link>
              <Link href="/#reading-log">收录日志</Link>
              <Link href="/#atelier">工作台</Link>
              <Link href="/search">搜索</Link>
            </nav>
            <div className={styles.avatar} />
          </header>
          <section className={styles.shell}>
            <article className={`${styles.card} ${styles.glass} ${styles.toolbarPanel}`}>
              <form action="/search" className={styles.toolbar} role="search">
                <div className={styles.toolbarLead}>
                  <p className={styles.eyebrow}>Search / Card First</p>
                  <span className={styles.searchBoxLabel}>搜索框</span>
                  <div className={styles.toolbarQueryRow}>
                    <div className={styles.toolbarQuery}>
                      <span className={styles.queryDot} />
                      <div className={styles.toolbarQueryCopy}>
                        <input
                          aria-label="搜索关键词"
                          className={styles.toolbarInput}
                          defaultValue={query}
                          name="q"
                          placeholder="输入关键词，例如 Agent 工作流"
                          type="search"
                        />
                        <span>{buildToolbarHint(query, noMatches)}</span>
                      </div>
                    </div>
                    <button className={styles.searchSubmit} type="submit">
                      搜索
                    </button>
                  </div>
                </div>
                <div className={styles.toolbarSummary}>
                  <span className={styles.toolbarSummaryKicker}>检索概览</span>
                  <div className={styles.toolbarSummaryStats}>
                    <span className={styles.summaryMetric}>
                      <strong>{noMatches && query.length > 0 ? "近似结果" : `${displayResults.length} 篇结果`}</strong>
                    </span>
                    <span className={styles.summaryMetric}>
                      <strong>{focusSnippets.length || 1} 个片段</strong>
                    </span>
                    <span className={styles.summaryMetric}>
                      <strong>仅公开文章</strong>
                    </span>
                  </div>
                  <p>{buildToolbarSummary(query, focusResult, noMatches)}</p>
                </div>
                <div aria-hidden="true" className={styles.toolbarActions}>
                  <span className={`${styles.filter} ${styles.filterActive}`}>全部</span>
                  <span className={styles.filter}>原创优先</span>
                  <span className={styles.filter}>收录优先</span>
                  <span className={styles.filter}>按最近发布</span>
                </div>
              </form>
            </article>

            {focusResult ? (
              <section className={styles.grid}>
                <aside className={styles.resultRail}>
                  {displayResults.map((result, index) => {
                    const isActive = result.entry.slug === focusResult.entry.slug;
                    const chipLabel = index === 0 ? "当前聚焦" : "相关文章";

                    return (
                      <Link
                        key={result.entry.slug}
                        className={`${styles.railItem} ${styles.card} ${styles.glass}${isActive ? ` ${styles.railActive}` : ""}`}
                        href={buildSearchHref(query, result.entry.slug)}
                      >
                        <span className={`${styles.chip}${isActive ? ` ${styles.chipActive}` : ""}`}>{chipLabel}</span>
                        <h3>{result.entry.title}</h3>
                        <div className={styles.railMeta}>
                          <span>{result.entry.kindLabel}</span>
                          <span>{result.entry.categoryName}</span>
                          <span>总分 {formatVisualScore(index)}</span>
                        </div>
                        <p>{buildRailSummary(result, index, query, focusDetail, focusSnippets)}</p>
                      </Link>
                    );
                  })}
                </aside>

                <div className={styles.focusStage}>
                  <article className={`${styles.focusCard} ${styles.card} ${styles.glass}`}>
                    <div className={styles.focusHeader}>
                      <div className={styles.sectionHead}>
                        <div>
                          <p className={styles.eyebrow}>Card First</p>
                          <h2 className={styles.focusTitle}>{focusResult.entry.title}</h2>
                        </div>
                        <span className={styles.statPill}>
                          {noMatches ? "当前推荐" : `命中 ${focusSnippets.length || 1} 个 chunk`}
                        </span>
                      </div>
                      <div className={styles.focusMeta}>
                        <span>{formatPublishedDate(focusResult.entry.publishedAt)}</span>
                        <span>{formatReadingTime(focusResult.entry.readingTime)}</span>
                        <span>
                          {focusDetail
                            ? `${focusDetail.authorDisplayName} / ${focusDetail.category.name}`
                            : focusResult.entry.categoryName}
                        </span>
                      </div>
                      <p className={styles.focusNote}>{buildFocusNote(query, noMatches)}</p>
                    </div>

                    <div className={styles.focusHero}>
                      <Link className={styles.focusCoverLink} href={`/articles/${focusResult.entry.slug}`}>
                        <div className={styles.focusCoverShell}>
                          <CoverSurface
                            alt={focusResult.entry.title}
                            className={styles.focusCover}
                            coverUrl={focusResult.entry.coverUrl}
                            priority
                            sizes="(max-width: 1200px) 100vw, 44vw"
                            tone={focusResult.entry.tone}
                          />
                        </div>
                      </Link>
                      <div className={styles.focusPreview}>
                        <span className={styles.previewLabel}>阅读判断</span>
                        <p className={styles.previewExcerpt}>{focusResult.entry.excerpt}</p>
                        <div className={styles.previewStats}>
                          <span className={styles.previewMetric}>{focusResult.entry.kindLabel}</span>
                          <span className={styles.previewMetric}>{focusResult.entry.categoryName}</span>
                          <span className={styles.previewMetric}>
                            {noMatches ? "近似结果" : `${focusSnippets.length || 1} 个 chunk`}
                          </span>
                        </div>
                        <p className={styles.previewSupport}>
                          {buildFocusPreviewNote(query, noMatches, focusSnippets.length)}
                        </p>
                      </div>
                    </div>

                    <div className={styles.focusBody}>
                      <p>{buildFocusSummary(focusResult, focusDetail, query)}</p>
                      <div className={styles.focusCallout}>
                        <span className={styles.statPill}>封面更早出现</span>
                        <span className={styles.statPill}>主卡头部更短</span>
                        <span className={styles.statPill}>视觉中心更稳</span>
                      </div>
                      <div className={`${styles.snippetGrid}${snippetCards.length > 1 ? ` ${styles.snippetGridTwo}` : ""}`}>
                        {snippetCards.map((snippet) => (
                          <div key={`${focusResult.entry.slug}-${snippet.label}`} className={styles.snippetCard}>
                            <strong>{snippet.label}</strong>
                            <p>{highlightText(snippet.text, query)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>

                <aside className={styles.assistantStage}>
                  <article className={`${styles.sideCard} ${styles.card} ${styles.dark}`}>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2>AI 摘要</h2>
                        <span className={styles.softLink}>辅助判断</span>
                      </div>
                    </div>
                    <p>{digest}</p>
                    <div className={styles.focusCallout}>
                      <span className={styles.statPill}>更干练</span>
                      <span className={styles.statPill}>工具感更强</span>
                    </div>
                  </article>

                  <article className={`${styles.sideCard} ${styles.card} ${styles.glass}`}>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2>引用来源</h2>
                        <span className={styles.softLink}>{displayResults.length} 篇相关文章</span>
                      </div>
                    </div>
                    <ol className={styles.sourceList}>
                      {displayResults.map((result) => (
                        <li key={result.entry.slug}>
                          <Link href={`/articles/${result.entry.slug}`}>{result.entry.title}</Link>
                        </li>
                      ))}
                    </ol>
                  </article>

                  <article className={`${styles.sideCard} ${styles.card} ${styles.glass}`}>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2>适合什么</h2>
                        <span className={styles.softLink}>最利落</span>
                      </div>
                    </div>
                    <p>如果你更想让这页像高质量工具页，而不是内容杂志页，这套会最直接。</p>
                  </article>
                </aside>
              </section>
            ) : (
              <article className={`${styles.emptyState} ${styles.card} ${styles.dark}`}>
                <h2>还没有可展示的结果</h2>
                <p>当前还没有足够的公开文章来组成搜索主卡，等内容积累起来之后，这里会直接进入三栏状态。</p>
              </article>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
