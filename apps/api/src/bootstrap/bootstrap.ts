import {
  featuredStories,
  latestEssays,
  readingLogs,
  siteStats,
} from "@/bootstrap/home-seed";
import { libraryArticles, libraryCategories } from "@/bootstrap/library-seed";
import type { AdminArticle, AdminToken, ArticleBlock, Asset, CategorySummary, HomeIssue } from "@xblog/contracts";
import { hashPassword, randomId } from "@/lib/security";

export type StoredAdminUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export type StoredSession = {
  id: string;
  sessionToken: string;
  userId: string;
  expiresAt: string;
};

export type StoredCategory = CategorySummary & {
  longSummary: string;
};

export type StoredArticle = AdminArticle & {
  coverUrl: string | null;
};

export type StoredApiToken = AdminToken & {
  tokenHash: string;
};

export type BootstrapState = {
  users: StoredAdminUser[];
  sessions: StoredSession[];
  categories: StoredCategory[];
  articles: StoredArticle[];
  assets: Asset[];
  homeIssue: HomeIssue;
  tokens: StoredApiToken[];
};

function sectionsToBlocks(sections: { heading: string; paragraphs: string[] }[]) {
  const blocks: ArticleBlock[] = [];

  for (const section of sections) {
    blocks.push({
      id: randomId(),
      type: "heading",
      level: 2,
      text: section.heading,
    });

    for (const paragraph of section.paragraphs) {
      blocks.push({
        id: randomId(),
        type: "paragraph",
        text: paragraph,
      });
    }
  }

  return blocks;
}

function convertCategories(): StoredCategory[] {
  const defaultCoverBySlug: Record<string, string> = {
    "frontend-interaction": "/images/category-covers/library/aurora-01-frontier.jpg",
    "ai-agent": "/images/category-covers/library/aurora-02-violet-horizon.jpg",
    "systems-design": "/images/category-covers/library/aurora-03-blue-ridge.jpg",
    "toolcraft": "/images/category-covers/library/aurora-04-violet-lake.jpg",
  };

  return libraryCategories.map((category, index) => ({
    id: randomId(),
    slug: category.slug,
    name: category.name,
    summary: category.summary,
    coverUrl: defaultCoverBySlug[category.slug] ?? null,
    coverAssetId: null,
    articleCountLabel: category.articleCountLabel,
    tone: category.tone,
    heroTitle: category.heroTitle,
    curatorNote: category.curatorNote,
    focusAreas: category.focusAreas,
    featuredArticleSlug: category.featuredArticleSlug,
    sortOrder: index,
    longSummary: category.longSummary,
  }));
}

function convertArticles(categories: StoredCategory[]): StoredArticle[] {
  return libraryArticles.map((article) => {
    const category = categories.find((entry) => entry.slug === article.categorySlug);

    return {
      id: randomId(),
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      lede: article.lede,
      kind: article.kind === "原创写作" ? "ORIGINAL" : "CURATED",
      status: "PUBLISHED",
      tone: article.tone,
      categoryId: category?.id ?? "",
      categorySlug: article.categorySlug,
      publishedAt: article.publishedAt,
      readingTime: article.readingTime,
      authorDisplayName: article.authorName,
      authorRoleLabel: article.authorRole,
      highlights: article.highlights,
      blocks: sectionsToBlocks(article.sections),
      coverAssetId: null,
      coverUrl: null,
      externalId: null,
      sourceUrl: article.kind === "收录整理" ? `https://curated.local/${article.slug}` : null,
      sourceTitle: article.kind === "收录整理" ? article.title : null,
      sourceAuthor: article.kind === "收录整理" ? article.authorName : null,
      sourcePublishedAt: article.kind === "收录整理" ? article.publishedAt : null,
      ingestSource: article.kind === "收录整理" ? "bootstrap:curated" : null,
      ingestScore: article.kind === "收录整理" ? 0.5 : null,
      reviewStatus: article.kind === "收录整理" ? "APPROVED" : null,
      originalLanguage: "zh",
      rewriteMode: article.kind === "收录整理" ? "single-source-curated-review" : null,
      sourceTrail:
        article.kind === "收录整理"
          ? [
              {
                sourceType: "blog",
                sourceName: "Bootstrap Library",
                sourceUrl: `https://curated.local/${article.slug}`,
                title: article.title,
                author: article.authorName,
                publishedAt: article.publishedAt,
                language: "zh",
                role: "primary",
              },
            ]
          : [],
    };
  });
}

function buildHomeIssue(articles: StoredArticle[]): HomeIssue {
  const byHref = new Map(articles.map((article) => [`/articles/${article.slug}`, article]));

  return {
    id: randomId(),
    issueNumber: "Issue 01",
    eyebrow: "XBlog / Aurora Edition",
    title: "让技术、阅读与沉淀，在同一片极光里发光。",
    lede: "这里记录技术文章、收录阅读与个人方法论，也把好内容重新整理成自己的知识版图。",
    note: null,
    primaryCtaLabel: "进入精选",
    primaryCtaHref: "/#latest",
    secondaryCtaLabel: "查看分类",
    secondaryCtaHref: "/categories",
    stats: siteStats,
    logoVariant: "prototype",
    heroArticleIds: {
      main: byHref.get(featuredStories[0].href)?.id ?? "",
      side1: byHref.get(featuredStories[1].href)?.id ?? "",
      side2: byHref.get(featuredStories[2].href)?.id ?? "",
    },
  };
}

export async function buildBootstrapState(): Promise<BootstrapState> {
  const categories = convertCategories();
  const articles = convertArticles(categories);
  const homeIssue = buildHomeIssue(articles);
  const latestOrder = new Map(latestEssays.map((item, index) => [item.href, index]));
  const curatedOrder = new Map(readingLogs.map((item, index) => [item.href, index]));

  articles.sort((a, b) => {
    const aHref = `/articles/${a.slug}`;
    const bHref = `/articles/${b.slug}`;
    const aOriginal = latestOrder.get(aHref);
    const bOriginal = latestOrder.get(bHref);
    if (typeof aOriginal === "number" && typeof bOriginal === "number") {
      return aOriginal - bOriginal;
    }
    const aCurated = curatedOrder.get(aHref);
    const bCurated = curatedOrder.get(bHref);
    if (typeof aCurated === "number" && typeof bCurated === "number") {
      return aCurated - bCurated;
    }
    return 0;
  });

  return {
    users: [
      {
        id: randomId(),
        email: "admin@xblog.local",
        displayName: "Alex",
        passwordHash: await hashPassword("admin12345"),
      },
    ],
    sessions: [],
    categories,
    articles,
    assets: [],
    homeIssue,
    tokens: [],
  };
}
