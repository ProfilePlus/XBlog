import type { ArticleBlock, CategoryTone } from "@xblog/contracts";
import type { SiteLogoVariant } from "@xblog/contracts";

export type FeatureStory = {
  title: string;
  description: string;
  category: string;
  tone: CategoryTone;
  coverUrl: string | null;
  href: string;
  authorLabel: string;
};

export type TopicShelf = {
  slug: string;
  name: string;
  summary: string;
  coverUrl: string | null;
  articleCount: string;
  tone: CategoryTone;
  href: string;
};

export type CreatorTool = {
  badge: string;
  title: string;
  description: string;
  href: string;
};

export type CategoryCoverPreview = {
  id: string;
  url: string;
  tone: CategoryTone | null;
};

export type CompactEntry = {
  title: string;
  description: string;
  tone: CategoryTone;
  coverUrl: string | null;
  href: string;
};

export type HomePageData = {
  issue: {
    issueNumber: string;
    eyebrow: string;
    title: string;
    lede: string;
    logoVariant: SiteLogoVariant;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  featuredStories: [FeatureStory, FeatureStory, FeatureStory];
  siteStats: string[];
  topicShelves: TopicShelf[];
  creatorTools: CreatorTool[];
  categoryCoverLibrary: {
    total: number;
    items: CategoryCoverPreview[];
  };
  latestEssays: CompactEntry[];
  readingLogs: CompactEntry[];
};

export type CategoryOverviewCard = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  coverUrl: string | null;
  articleCountLabel: string;
  tone: CategoryTone;
  focusAreas: string[];
  featuredTitle: string | null;
};

export type CategoryDetailArticle = {
  slug: string;
  title: string;
  excerpt: string;
  tone: CategoryTone;
  coverUrl: string | null;
  kindLabel: string;
  publishedAt: string;
  readingTime: string;
};

export type CategoryDetailPageData = {
  category: {
    slug: string;
    name: string;
    heroTitle: string;
    longSummary: string;
    curatorNote: string;
    focusAreas: string[];
    articleCountLabel: string;
    featuredArticleSlug: string | null;
  };
  articles: CategoryDetailArticle[];
};

export type ArticleSectionGroup = {
  id: string;
  heading: string;
  blocks: ArticleBlock[];
};

export type ArticlePageData = {
  title: string;
  lede: string;
  excerpt: string;
  tone: CategoryTone;
  coverUrl: string | null;
  kindLabel: string;
  publishedAt: string;
  readingTime: string;
  authorDisplayName: string;
  authorRoleLabel: string;
  category: {
    slug: string;
    name: string;
  };
  highlights: string[];
  sections: ArticleSectionGroup[];
  related: {
    slug: string;
    title: string;
    excerpt: string;
  }[];
};
