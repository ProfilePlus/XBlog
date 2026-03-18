import type { PrismaClient } from "@prisma/client";
import { featuredStories, siteStats } from "@/bootstrap/home-seed";
import { libraryArticles, libraryCategories } from "@/bootstrap/library-seed";
import { displayDateToDate } from "@/lib/dates";
import { hashPassword, randomId } from "@/lib/security";
import type { ArticleBlock } from "@xblog/contracts";

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

type SeedOptions = {
  reset?: boolean;
};

export async function seedPrismaFromBootstrap(prisma: PrismaClient, options: SeedOptions = {}) {
  if (options.reset) {
    await prisma.homeIssueHeroSlot.deleteMany();
    await prisma.homeIssue.deleteMany();
    await prisma.adminSession.deleteMany();
    await prisma.apiToken.deleteMany();
    await prisma.article.deleteMany();
    await prisma.category.deleteMany();
    await prisma.adminUser.deleteMany();
  }

  const categories = [];
  for (const [index, category] of libraryCategories.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        tone: category.tone,
        summary: category.summary,
        heroTitle: category.heroTitle,
        longSummary: category.longSummary,
        curatorNote: category.curatorNote,
        focusAreas: category.focusAreas,
        sortOrder: index,
      },
      create: {
        slug: category.slug,
        name: category.name,
        tone: category.tone,
        summary: category.summary,
        heroTitle: category.heroTitle,
        longSummary: category.longSummary,
        curatorNote: category.curatorNote,
        focusAreas: category.focusAreas,
        sortOrder: index,
      },
    });
    categories.push(created);
  }

  const articles = [];
  for (const article of libraryArticles) {
    const category = categories.find((entry) => entry.slug === article.categorySlug);
    if (!category) {
      continue;
    }

    const publishedAt = displayDateToDate(article.publishedAt) ?? new Date();
    const sourceUrl = article.kind === "收录整理" ? `https://curated.local/${article.slug}` : null;

    const created = await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        lede: article.lede,
        kind: article.kind === "原创写作" ? "ORIGINAL" : "CURATED",
        status: "PUBLISHED",
        tone: article.tone,
        readingTime: article.readingTime,
        authorDisplayName: article.authorName,
        authorRoleLabel: article.authorRole,
        highlights: article.highlights,
        contentBlocks: sectionsToBlocks(article.sections),
        publishedAt,
        sourceUrl,
        sourceTitle: sourceUrl ? article.title : null,
        sourceAuthor: sourceUrl ? article.authorName : null,
        sourcePublishedAt: sourceUrl ? publishedAt : null,
        categoryId: category.id,
      },
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        lede: article.lede,
        kind: article.kind === "原创写作" ? "ORIGINAL" : "CURATED",
        status: "PUBLISHED",
        tone: article.tone,
        readingTime: article.readingTime,
        authorDisplayName: article.authorName,
        authorRoleLabel: article.authorRole,
        highlights: article.highlights,
        contentBlocks: sectionsToBlocks(article.sections),
        publishedAt,
        sourceUrl,
        sourceTitle: sourceUrl ? article.title : null,
        sourceAuthor: sourceUrl ? article.authorName : null,
        sourcePublishedAt: sourceUrl ? publishedAt : null,
        categoryId: category.id,
      },
    });
    articles.push(created);
  }

  for (const category of libraryCategories) {
    const featured = articles.find((entry) => entry.slug === category.featuredArticleSlug);
    if (!featured) {
      continue;
    }

    await prisma.category.update({
      where: { slug: category.slug },
      data: {
        featuredArticleId: featured.id,
      },
    });
  }

  const issue = await prisma.homeIssue.upsert({
    where: { issueNumber: "Issue 01" },
    update: {
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
      status: "CURRENT",
    },
    create: {
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
      status: "CURRENT",
    },
  });

  await prisma.homeIssueHeroSlot.deleteMany({
    where: { homeIssueId: issue.id },
  });

  const articleByHref = new Map(articles.map((entry) => [`/articles/${entry.slug}`, entry]));
  const heroSeeds = [
    { slot: "MAIN" as const, href: featuredStories[0].href },
    { slot: "SIDE_1" as const, href: featuredStories[1].href },
    { slot: "SIDE_2" as const, href: featuredStories[2].href },
  ];

  for (const heroSeed of heroSeeds) {
    const article = articleByHref.get(heroSeed.href) ?? articles[0];
    if (!article) {
      continue;
    }

    await prisma.homeIssueHeroSlot.create({
      data: {
        homeIssueId: issue.id,
        articleId: article.id,
        slot: heroSeed.slot,
      },
    });
  }

  await prisma.adminUser.upsert({
    where: { email: "admin@xblog.local" },
    update: {
      displayName: "Alex",
      passwordHash: await hashPassword("admin12345"),
    },
    create: {
      email: "admin@xblog.local",
      displayName: "Alex",
      passwordHash: await hashPassword("admin12345"),
    },
  });
}
