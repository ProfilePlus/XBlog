import type {
  ArticleBlock,
  ArticleSummary,
  CategorySummary,
  PublicArticleDetail,
  PublicCategoryDetail,
  PublicHomeResponse,
  PublicSiteBrandingResponse,
} from "@xblog/contracts";
import { webConfig } from "@/lib/config";
import type {
  ArticlePageData,
  ArticleSectionGroup,
  CategoryDetailPageData,
  CategoryOverviewCard,
  CompactEntry,
  FeatureStory,
  HomePageData,
  TopicShelf,
} from "@/lib/view-models";

function articleHref(slug: string) {
  return `/articles/${slug}`;
}

function categoryHref(slug: string) {
  return `/categories/${slug}`;
}

function kindLabel(kind: ArticleSummary["kind"]) {
  return kind === "ORIGINAL" ? "原创写作" : "收录整理";
}

function toneClassValue<T>(value: T | undefined, fallback: T) {
  return value ?? fallback;
}

async function apiFetch<T>(path: string, allowNotFound = false): Promise<T | null> {
  const response = await fetch(`${webConfig.apiBaseUrl}${path}`, {
    cache: "no-store",
  });

  if (allowNotFound && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${path} (${response.status})`);
  }

  return (await response.json()) as T;
}

function toFeatureStory(article: ArticleSummary, label: string): FeatureStory {
  return {
    title: article.title,
    description: article.excerpt,
    category: label,
    tone: article.tone,
    coverUrl: article.coverUrl,
    href: articleHref(article.slug),
    authorLabel: `${article.authorDisplayName} / ${article.authorRoleLabel}`,
  };
}

function toCompactEntry(article: ArticleSummary): CompactEntry {
  return {
    title: article.title,
    description: article.excerpt,
    tone: article.tone,
    coverUrl: article.coverUrl,
    href: articleHref(article.slug),
  };
}

function toTopicShelf(category: CategorySummary): TopicShelf {
  return {
    slug: category.slug,
    name: category.name,
    summary: category.summary,
    coverUrl: category.coverUrl,
    articleCount: category.articleCountLabel,
    tone: category.tone,
    href: categoryHref(category.slug),
  };
}

function toSectionGroups(blocks: ArticleBlock[]): ArticleSectionGroup[] {
  const sections: ArticleSectionGroup[] = [];
  let current: ArticleSectionGroup | null = null;

  for (const block of blocks) {
    if (block.type === "heading") {
      if (current) {
        sections.push(current);
      }

      current = {
        id: block.id,
        heading: block.text,
        blocks: [],
      };
      continue;
    }

    if (!current) {
      current = {
        id: "body",
        heading: "正文",
        blocks: [],
      };
    }

    current.blocks.push(block);
  }

  if (current) {
    sections.push(current);
  }

  return sections.length > 0
    ? sections
    : [
        {
          id: "body",
          heading: "正文",
          blocks: [],
        },
      ];
}

export async function getHomePageData(): Promise<HomePageData> {
  const payload = await apiFetch<PublicHomeResponse>("/v1/public/home");
  if (!payload) {
    throw new Error("Home payload is unavailable.");
  }

  const featuredArticles = [...payload.latestOriginals, ...payload.latestCurated].slice(0, 6);

  return {
    featuredArticles: featuredArticles.map((article) => ({
      title: article.title,
      description: article.excerpt,
      tone: article.tone,
      coverUrl: article.coverUrl,
      href: articleHref(article.slug),
      category: article.categoryName,
      authorLabel: `${article.authorDisplayName} / ${article.authorRoleLabel}`,
    })),
    topicShelves: payload.categoryShelves.map(toTopicShelf),
    latestEssays: payload.latestOriginals.map(toCompactEntry),
    readingLogs: payload.latestCurated.map(toCompactEntry),
  } as HomePageData;
}

export async function getSiteBrandingData(): Promise<PublicSiteBrandingResponse> {
  try {
    const payload = await apiFetch<PublicSiteBrandingResponse>("/v1/public/site-branding", true);
    return (
      payload ?? {
        logoVariant: "prototype",
      }
    );
  } catch {
    return {
      logoVariant: "prototype",
    };
  }
}

export async function getCategoryOverviewCards(): Promise<CategoryOverviewCard[]> {
  const categories = await apiFetch<(CategorySummary & { longSummary?: string })[]>("/v1/public/categories");
  if (!categories) {
    return [];
  }

  const details = await Promise.all(
    categories.map(async (category) => {
      const detail = await apiFetch<PublicCategoryDetail>(`/v1/public/categories/${category.slug}`, true);
      return [category.slug, detail] as const;
    }),
  );

  const detailMap = new Map(details);

  return categories.map((category) => {
    const detail = detailMap.get(category.slug);
    const featuredTitle =
      detail?.articles.find((article) => article.slug === category.featuredArticleSlug)?.title ??
      detail?.articles[0]?.title ??
      null;

    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      summary: category.summary,
      coverUrl: category.coverUrl,
      articleCountLabel: category.articleCountLabel,
      tone: category.tone,
      focusAreas: category.focusAreas,
      featuredTitle,
    };
  });
}

export async function getCategoryDetailPageData(slug: string): Promise<CategoryDetailPageData | null> {
  const payload = await apiFetch<PublicCategoryDetail>(`/v1/public/categories/${slug}`, true);
  if (!payload) {
    return null;
  }

  return {
    category: {
      slug: payload.category.slug,
      name: payload.category.name,
      heroTitle: payload.category.heroTitle,
      longSummary: payload.category.longSummary,
      curatorNote: payload.category.curatorNote,
      focusAreas: payload.category.focusAreas,
      articleCountLabel: payload.category.articleCountLabel,
      featuredArticleSlug: payload.category.featuredArticleSlug,
    },
    articles: payload.articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      tone: article.tone,
      coverUrl: article.coverUrl,
      kindLabel: kindLabel(article.kind),
      publishedAt: article.publishedAt,
      readingTime: article.readingTime,
    })),
  };
}

export async function getArticlePageData(slug: string): Promise<ArticlePageData | null> {
  const payload = await apiFetch<PublicArticleDetail>(`/v1/public/articles/${slug}`, true);
  if (!payload) {
    return null;
  }

  return {
    title: payload.title,
    lede: payload.lede,
    excerpt: payload.excerpt,
    tone: payload.tone,
    coverUrl: payload.coverUrl,
    kindLabel: kindLabel(payload.kind),
    publishedAt: payload.publishedAt,
    readingTime: payload.readingTime,
    authorDisplayName: payload.authorDisplayName,
    authorRoleLabel: payload.authorRoleLabel,
    category: {
      slug: payload.categorySlug,
      name: payload.categoryName,
    },
    highlights: payload.highlights,
    sections: toSectionGroups(payload.blocks),
    related: payload.related.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
    })),
  };
}
