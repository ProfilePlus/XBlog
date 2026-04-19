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
  const coverImages = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=400&fit=crop",
  ];

  for (const [index, article] of libraryArticles.entries()) {
    const category = categories.find((entry) => entry.slug === article.categorySlug);
    if (!category) {
      continue;
    }

    const publishedAt = displayDateToDate(article.publishedAt) ?? new Date();
    const sourceUrl = article.kind === "收录整理" ? `https://curated.local/${article.slug}` : null;
    const coverUrl = coverImages[index % coverImages.length];

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
        coverUrl,
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
        coverUrl,
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
