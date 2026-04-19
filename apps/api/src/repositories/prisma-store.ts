import fs from "node:fs/promises";
import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  AdminArticle,
  AdminCategory,
  AdminToken,
  ArticleBlock,
  Asset,
  IngestArticleRequest,
  IngestArticleResponse,
  PublicArticleDetail,
  PublicHomeResponse,
  PublicSiteBrandingResponse,
  UpsertArticleRequest,
} from "@xblog/contracts";
import { seedPrismaFromBootstrap } from "@/bootstrap/prisma-seed";
import { formatDisplayDate } from "@/lib/dates";
import { getObjectStorage, type ObjectStorage } from "@/lib/object-storage";
import { createSlug, ensureUniqueSlug } from "@/lib/slug";
import { randomToken, sha256, verifyPassword } from "@/lib/security";
import type { Store, StoreAdminUser, StoreSession, UpsertCategoryPayload } from "@/repositories/store";

type ArticleRecord = Prisma.ArticleGetPayload<{
  include: {
    category: true;
    coverAsset: true;
  };
}>;

type CategoryRecord = Prisma.CategoryGetPayload<{
  include: {
    coverAsset: true;
    _count: {
      select: {
        articles: true;
      };
    };
  };
}>;

function articleCountLabel(count: number) {
  return `${count} 篇文章`;
}

export class PrismaStore implements Store {
  private constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: ObjectStorage,
  ) {}

  static async create(prisma: PrismaClient) {
    const store = new PrismaStore(prisma, getObjectStorage());
    await store.prisma.$connect();
    await store.ensureSeeded();
    return store;
  }

  private async ensureSeeded() {
    const count = await this.prisma.category.count();
    if (count > 0) {
      return;
    }

    await seedPrismaFromBootstrap(this.prisma);
  }

  private async resolveFeaturedArticleSlug(featuredArticleId: string | null) {
    if (!featuredArticleId) {
      return null;
    }

    const article = await this.prisma.article.findUnique({
      where: { id: featuredArticleId },
      select: { slug: true },
    });

    return article?.slug ?? null;
  }

  private hashSlug(slug: string) {
    let hash = 0;

    for (let index = 0; index < slug.length; index += 1) {
      hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
    }

    return hash;
  }

  private coverReferenceKey(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const normalized = value.split(/[?#]/, 1)[0]?.replace(/\\/g, "/") ?? "";
    const segment = normalized.split("/").filter(Boolean).pop();
    return segment?.toLowerCase() ?? null;
  }

  private async listCategoryCoverAssetRecords() {
    return this.prisma.asset.findMany({
      where: { kind: "CATEGORY_COVER" },
      include: { categories: true },
      orderBy: { createdAt: "asc" },
    });
  }

  private resolveCategoryCoverUrls(categories: CategoryCoverUsageRecord[], coverAssets: CategoryCoverAssetRecord[]) {
    const manualAssignments = new Set(categories.map((category) => category.coverAssetId).filter(Boolean));
    const unusedAssets = coverAssets.filter((asset) => !manualAssignments.has(asset.id));
    const usedAutoAssetIds = new Set<string>();
    const resolved = new Map<string, string | null>();

    for (const category of [...categories].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (category.coverAssetId) {
        resolved.set(category.id, category.coverAsset?.url ?? category.coverUrl ?? null);
        continue;
      }

      if (category.coverUrl) {
        resolved.set(category.id, category.coverUrl);
        continue;
      }

      const toneMatches = unusedAssets.filter(
        (asset) => asset.tone === category.tone && !usedAutoAssetIds.has(asset.id),
      );
      const pool = toneMatches.length > 0 ? toneMatches : unusedAssets.filter((asset) => !usedAutoAssetIds.has(asset.id));

      if (pool.length === 0) {
        resolved.set(category.id, null);
        continue;
      }

      const selected = pool[this.hashSlug(category.slug) % pool.length];
      usedAutoAssetIds.add(selected.id);
      resolved.set(category.id, selected.url);
    }

    return resolved;
  }

  private buildCategoryCoverAssetAssignments(
    categories: CategoryCoverUsageRecord[],
    coverAssets: CategoryCoverAssetRecord[],
  ) {
    const resolvedCoverUrls = this.resolveCategoryCoverUrls(categories, coverAssets);
    const assignments = new Map<string, CategoryCoverUsageRecord>();

    for (const category of [...categories].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const resolvedCoverUrl = resolvedCoverUrls.get(category.id);
      const matchedAsset = category.coverAssetId
        ? coverAssets.find((asset) => asset.id === category.coverAssetId)
        : coverAssets.find(
            (asset) =>
              asset.url === resolvedCoverUrl ||
              asset.sourceUrl === resolvedCoverUrl ||
              this.coverReferenceKey(asset.url) === this.coverReferenceKey(resolvedCoverUrl) ||
              this.coverReferenceKey(asset.sourceUrl) === this.coverReferenceKey(resolvedCoverUrl),
          );

      if (matchedAsset && !assignments.has(matchedAsset.id)) {
        assignments.set(matchedAsset.id, category);
      }
    }

    return assignments;
  }

  private toCategoryCoverAssetSummary(
    record: CategoryCoverAssetRecord,
    assignments?: Map<string, CategoryCoverUsageRecord>,
  ) {
    const assignedCategory = assignments?.get(record.id) ?? record.categories[0] ?? null;

    return {
      id: record.id,
      url: record.url,
      tone: record.tone,
      label: record.label,
      width: record.width,
      height: record.height,
      createdAt: record.createdAt.toISOString(),
      isAssigned: Boolean(assignedCategory),
      assignedCategoryId: assignedCategory?.id ?? null,
      assignedCategoryName: assignedCategory?.name ?? null,
      assignedCategorySlug: assignedCategory?.slug ?? null,
    };
  }

  private async toAdminCategory(record: CategoryRecord, resolvedCoverUrl?: string | null): Promise<AdminCategory> {
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      summary: record.summary,
      coverUrl: resolvedCoverUrl ?? record.coverAsset?.url ?? record.coverUrl,
      coverAssetId: record.coverAssetId,
      articleCountLabel: articleCountLabel(record._count.articles),
      tone: record.tone,
      heroTitle: record.heroTitle,
      curatorNote: record.curatorNote,
      focusAreas: (record.focusAreas as string[]) ?? [],
      featuredArticleSlug: await this.resolveFeaturedArticleSlug(record.featuredArticleId),
      sortOrder: record.sortOrder,
      longSummary: record.longSummary,
    };
  }

  private toAdminArticle(record: ArticleRecord): AdminArticle {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      excerpt: record.excerpt,
      lede: record.lede,
      kind: record.kind,
      status: record.status,
      tone: record.tone,
      categoryId: record.categoryId,
      categorySlug: record.category.slug,
      publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
      readingTime: record.readingTime,
      authorDisplayName: record.authorDisplayName,
      authorRoleLabel: record.authorRoleLabel,
      highlights: (record.highlights as string[]) ?? [],
      blocks: (record.contentBlocks as ArticleBlock[]) ?? [],
      coverAssetId: record.coverAssetId,
      coverUrl: record.coverAsset?.url ?? null,
      externalId: record.externalId,
      sourceUrl: record.sourceUrl,
      sourceTitle: record.sourceTitle,
      sourceAuthor: record.sourceAuthor,
      sourcePublishedAt: record.sourcePublishedAt ? record.sourcePublishedAt.toISOString() : null,
      ingestSource: record.ingestSource,
      ingestScore: record.ingestScore,
      reviewStatus: record.reviewStatus,
      originalLanguage: record.originalLanguage as AdminArticle["originalLanguage"],
      rewriteMode: record.rewriteMode as AdminArticle["rewriteMode"],
      sourceTrail: (record.sourceTrail as AdminArticle["sourceTrail"]) ?? [],
    };
  }

  private toArticleSummary(record: ArticleRecord) {
    return {
      id: record.id,
      slug: record.slug,
      title: record.title,
      excerpt: record.excerpt,
      lede: record.lede,
      kind: record.kind,
      tone: record.tone,
      publishedAt: formatDisplayDate(record.publishedAt),
      readingTime: record.readingTime,
      categorySlug: record.category.slug,
      categoryName: record.category.name,
      authorDisplayName: record.authorDisplayName,
      authorRoleLabel: record.authorRoleLabel,
      coverUrl: record.coverAsset?.url ?? null,
      sourceUrl: record.sourceUrl,
    };
  }

  private toHomeIssue(issue: HomeIssueRecord): HomeIssue {
    const slotMap = new Map(issue.heroSlots.map((slot) => [slot.slot, slot.articleId]));

    return {
      id: issue.id,
      issueNumber: issue.issueNumber,
      eyebrow: issue.eyebrow,
      title: issue.title,
      lede: issue.lede,
      note: issue.note,
      primaryCtaLabel: issue.primaryCtaLabel,
      primaryCtaHref: issue.primaryCtaHref,
      secondaryCtaLabel: issue.secondaryCtaLabel,
      secondaryCtaHref: issue.secondaryCtaHref,
      stats: (issue.stats as string[]) ?? [],
      logoVariant: this.normalizeLogoVariant(issue.logoVariant),
      heroArticleIds: {
        main: slotMap.get("MAIN") ?? "",
        side1: slotMap.get("SIDE_1") ?? "",
        side2: slotMap.get("SIDE_2") ?? "",
      },
    };
  }

  private async getArticleBySlugWithRelations(slug: string) {
    return this.prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        coverAsset: true,
      },
    });
  }

  private async getArticleByIdWithRelations(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        coverAsset: true,
      },
    });
  }

  private async ensureUniqueArticleSlug(baseSlug: string, currentId?: string) {
    const existing = await this.prisma.article.findMany({
      select: { id: true, slug: true },
    });

    return ensureUniqueSlug(
      baseSlug,
      new Set(existing.map((entry) => entry.slug)),
      existing.find((entry) => entry.id === currentId)?.slug,
    );
  }

  private async ensureUniqueCategorySlug(baseSlug: string, currentId?: string) {
    const existing = await this.prisma.category.findMany({
      select: { id: true, slug: true },
    });

    return ensureUniqueSlug(
      baseSlug,
      new Set(existing.map((entry) => entry.slug)),
      existing.find((entry) => entry.id === currentId)?.slug,
    );
  }

  async saveAsset(asset: Asset) {
    await this.prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        storageKey: asset.storageKey,
        url: asset.url,
        mimeType: asset.mimeType,
        kind: asset.kind,
        tone: asset.tone,
        label: asset.label,
        width: asset.width,
        height: asset.height,
        sourceUrl: asset.sourceUrl,
      },
      create: {
        id: asset.id,
        storageKey: asset.storageKey,
        url: asset.url,
        mimeType: asset.mimeType,
        kind: asset.kind,
        tone: asset.tone,
        label: asset.label,
        width: asset.width,
        height: asset.height,
        sourceUrl: asset.sourceUrl,
        createdAt: new Date(asset.createdAt),
      },
    });

    return asset;
  }

  async listCategories() {
    const [categories, coverAssets] = await Promise.all([
      this.prisma.category.findMany({
        include: {
          coverAsset: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      this.listCategoryCoverAssetRecords(),
    ]);
    const resolvedCoverUrls = this.resolveCategoryCoverUrls(categories, coverAssets);

    return Promise.all(categories.map((category) => this.toAdminCategory(category, resolvedCoverUrls.get(category.id))));
  }

  async getCategoryBySlug(slug: string) {
    const categories = await this.listCategories();
    return categories.find((category) => category.slug === slug) ?? null;
  }

  async listArticles() {
    const articles = await this.prisma.article.findMany({
      include: {
        category: true,
        coverAsset: true,
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });

    return articles.map((article) => this.toAdminArticle(article));
  }

  async getArticleBySlug(slug: string) {
    const article = await this.getArticleBySlugWithRelations(slug);
    return article ? this.toAdminArticle(article) : null;
  }

  async getArticleById(id: string) {
    const article = await this.getArticleByIdWithRelations(id);
    return article ? this.toAdminArticle(article) : null;
  }

  async authenticateAdmin(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    } satisfies StoreAdminUser;
  }

  async createSession(userId: string) {
    const session = await this.prisma.adminSession.create({
      data: {
        sessionToken: randomToken("xbs"),
        userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return {
      id: session.id,
      sessionToken: session.sessionToken,
      userId: session.userId,
      expiresAt: session.expiresAt.toISOString(),
    } satisfies StoreSession;
  }

  async getSession(sessionToken: string) {
    const session = await this.prisma.adminSession.findUnique({
      where: { sessionToken },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.deleteSession(sessionToken);
      return null;
    }

    return {
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
      },
    };
  }

  async deleteSession(sessionToken: string) {
    await this.prisma.adminSession.deleteMany({
      where: { sessionToken },
    });
  }

  async listTokens() {
    const tokens = await this.prisma.apiToken.findMany({
      orderBy: { createdAt: "desc" },
    });

    return tokens.map((token) => ({
      id: token.id,
      label: token.label,
      scopes: (token.scopes as AdminToken["scopes"]) ?? [],
      prefix: token.prefix,
      isActive: token.isActive,
      createdAt: token.createdAt.toISOString(),
      lastUsedAt: token.lastUsedAt ? token.lastUsedAt.toISOString() : null,
    }));
  }

  async createToken(label: string, scopes: AdminToken["scopes"]) {
    const plainTextToken = randomToken("xbt");
    const token = await this.prisma.apiToken.create({
      data: {
        label,
        prefix: plainTextToken.slice(0, 12),
        tokenHash: sha256(plainTextToken),
        scopes,
      },
    });

    return {
      token: {
        id: token.id,
        label: token.label,
        scopes: (token.scopes as AdminToken["scopes"]) ?? [],
        prefix: token.prefix,
        isActive: token.isActive,
        createdAt: token.createdAt.toISOString(),
        lastUsedAt: token.lastUsedAt ? token.lastUsedAt.toISOString() : null,
      },
      plainTextToken,
    };
  }

  async revokeToken(id: string) {
    const token = await this.prisma.apiToken.findUnique({
      where: { id },
    });
    if (!token) {
      return null;
    }

    const updated = await this.prisma.apiToken.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      id: updated.id,
      label: updated.label,
      scopes: (updated.scopes as AdminToken["scopes"]) ?? [],
      prefix: updated.prefix,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      lastUsedAt: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
    };
  }

  async deleteToken(id: string) {
    const token = await this.prisma.apiToken.findUnique({
      where: { id },
    });
    if (!token) {
      return null;
    }

    const deleted = await this.prisma.apiToken.delete({
      where: { id },
    });

    return {
      id: deleted.id,
      label: deleted.label,
      scopes: (deleted.scopes as AdminToken["scopes"]) ?? [],
      prefix: deleted.prefix,
      isActive: deleted.isActive,
      createdAt: deleted.createdAt.toISOString(),
      lastUsedAt: deleted.lastUsedAt ? deleted.lastUsedAt.toISOString() : null,
    };
  }

  async findToken(rawToken: string) {
    const token = await this.prisma.apiToken.findFirst({
      where: {
        prefix: rawToken.slice(0, 12),
        tokenHash: sha256(rawToken),
        isActive: true,
      },
    });

    if (!token) {
      return null;
    }

    const updated = await this.prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: updated.id,
      label: updated.label,
      scopes: (updated.scopes as AdminToken["scopes"]) ?? [],
      prefix: updated.prefix,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      lastUsedAt: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
    };
  }

  async getPublicHome(): Promise<PublicHomeResponse> {
    const originals = await this.prisma.article.findMany({
      where: { status: "PUBLISHED", kind: "ORIGINAL" },
      include: {
        category: true,
        coverAsset: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });

    const curated = await this.prisma.article.findMany({
      where: { status: "PUBLISHED", kind: "CURATED" },
      include: {
        category: true,
        coverAsset: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
    });

    const categories = await this.listCategories();

    return {
      categoryShelves: categories,
      latestOriginals: originals.map((article) => this.toArticleSummary(article)),
      latestCurated: curated.map((article) => this.toArticleSummary(article)),
    };
  }

  async getPublicSiteBranding(): Promise<PublicSiteBrandingResponse> {
    return {
      logoVariant: "prototype",
    };
  }

  async getPublicCategoryDetail(slug: string) {
    const category = await this.getCategoryBySlug(slug);
    if (!category) {
      return null;
    }

    const articles = await this.prisma.article.findMany({
      where: {
        categoryId: category.id,
        status: "PUBLISHED",
      },
      include: {
        category: true,
        coverAsset: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    return {
      category: {
        ...category,
        longSummary: category.longSummary,
      },
      articles: articles.map((article) => this.toArticleSummary(article)),
    };
  }

  async getPublicArticleDetail(slug: string): Promise<PublicArticleDetail | null> {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        category: true,
        coverAsset: true,
      },
    });

    if (!article) {
      return null;
    }

    const related = await this.prisma.article.findMany({
      where: {
        categoryId: article.categoryId,
        status: "PUBLISHED",
        id: { not: article.id },
      },
      include: {
        category: true,
        coverAsset: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    return {
      ...this.toArticleSummary(article),
      highlights: (article.highlights as string[]) ?? [],
      blocks: (article.contentBlocks as ArticleBlock[]) ?? [],
      related: related.map((entry) => this.toArticleSummary(entry)),
    };
  }

  async upsertCategory(payload: UpsertCategoryPayload) {
    const slug = await this.ensureUniqueCategorySlug(payload.slug, payload.id);
    const featured = payload.featuredArticleSlug
      ? await this.prisma.article.findUnique({
          where: { slug: payload.featuredArticleSlug },
          select: { id: true },
        })
      : null;
    if (payload.coverAssetId) {
      const coverAsset = await this.prisma.asset.findUnique({
        where: { id: payload.coverAssetId },
        select: { id: true },
      });
      if (!coverAsset) {
        throw new Error("Asset not found");
      }
    }

    const categoryData = {
      slug,
      name: payload.name,
      summary: payload.summary,
      coverUrl: payload.coverAssetId ? null : payload.coverUrl,
      coverAssetId: payload.coverAssetId,
      tone: payload.tone,
      heroTitle: payload.heroTitle,
      longSummary: payload.longSummary,
      curatorNote: payload.curatorNote,
      focusAreas: payload.focusAreas,
      featuredArticleId: featured?.id ?? null,
      sortOrder: payload.sortOrder,
    } satisfies Prisma.CategoryUncheckedCreateInput;

    if (payload.id) {
      const existing = await this.prisma.category.findUnique({
        where: { id: payload.id },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("Category not found");
      }
    }

    let category: CategoryRecord;
    try {
      category = payload.id
        ? await this.prisma.category.update({
            where: { id: payload.id },
            data: categoryData,
            include: {
              coverAsset: true,
              _count: {
                select: { articles: true },
              },
            },
          })
        : await this.prisma.category.create({
            data: categoryData,
            include: {
              coverAsset: true,
              _count: {
                select: { articles: true },
              },
            },
          });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("coverAssetId")
      ) {
        throw new Error("Category cover asset is already assigned");
      }

      throw error;
    }

    return this.toAdminCategory(category);
  }

  async upsertArticle(payload: UpsertArticleRequest & { id?: string }) {
    const category = await this.prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const current = payload.id
      ? await this.prisma.article.findUnique({
          where: { id: payload.id },
          select: { publishedAt: true, externalId: true },
        })
      : null;
    const slug = await this.ensureUniqueArticleSlug(payload.slug || createSlug(payload.title), payload.id);
    const updateData: Prisma.ArticleUncheckedUpdateInput = {
      slug,
      title: payload.title,
      excerpt: payload.excerpt,
      lede: payload.lede,
      kind: payload.kind,
      tone: payload.tone,
      categoryId: payload.categoryId,
      readingTime: payload.readingTime,
      authorDisplayName: payload.authorDisplayName,
      authorRoleLabel: payload.authorRoleLabel,
      highlights: payload.highlights,
      contentBlocks: payload.blocks,
      coverAssetId: payload.coverAssetId,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      sourceAuthor: payload.sourceAuthor,
      sourcePublishedAt: payload.sourcePublishedAt ? new Date(payload.sourcePublishedAt) : null,
      externalId: current?.externalId ?? null,
      ingestSource: null,
      ingestScore: null,
      reviewStatus: null,
      originalLanguage: null,
      rewriteMode: null,
      sourceTrail: [],
    };
    const createData: Prisma.ArticleUncheckedCreateInput = {
      slug,
      title: payload.title,
      excerpt: payload.excerpt,
      lede: payload.lede,
      kind: payload.kind,
      status: "DRAFT",
      tone: payload.tone,
      categoryId: payload.categoryId,
      publishedAt: current?.publishedAt ?? null,
      readingTime: payload.readingTime,
      authorDisplayName: payload.authorDisplayName,
      authorRoleLabel: payload.authorRoleLabel,
      highlights: payload.highlights,
      contentBlocks: payload.blocks,
      coverAssetId: payload.coverAssetId,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      sourceAuthor: payload.sourceAuthor,
      sourcePublishedAt: payload.sourcePublishedAt ? new Date(payload.sourcePublishedAt) : null,
      externalId: null,
      ingestSource: null,
      ingestScore: null,
      reviewStatus: null,
      originalLanguage: null,
      rewriteMode: null,
      sourceTrail: [],
    };

    const article = payload.id
      ? await this.prisma.article.update({
          where: { id: payload.id },
          data: updateData,
          include: {
            category: true,
            coverAsset: true,
          },
        })
      : await this.prisma.article.create({
          data: createData,
          include: {
            category: true,
            coverAsset: true,
          },
        });

    return this.toAdminArticle(article);
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      return null;
    }

    if (category._count.articles > 0) {
      throw new Error("Category is not empty");
    }

    const deleted = await this.prisma.category.delete({
      where: { id },
      include: {
        coverAsset: true,
        _count: {
          select: { articles: true },
        },
      },
    });

    return this.toAdminCategory(deleted);
  }

  async deleteArticle(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        coverAsset: true,
      },
    });

    if (!article) {
      return null;
    }

    const deleted = await this.prisma.article.delete({
      where: { id },
      include: {
        category: true,
        coverAsset: true,
      },
    });

    return this.toAdminArticle(deleted);
  }

  async publishArticle(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: existing.publishedAt ?? new Date(),
        reviewStatus: existing.reviewStatus ? "APPROVED" : existing.reviewStatus,
      },
      include: {
        category: true,
        coverAsset: true,
      },
    });

    return this.toAdminArticle(article);
  }

  async hideArticle(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: "HIDDEN" },
      include: {
        category: true,
        coverAsset: true,
      },
    });

    return this.toAdminArticle(article);
  }

  async uploadAsset(buffer: Buffer, fileName: string, mimeType?: string) {
    const asset = await this.storage.storeBuffer(buffer, fileName, mimeType);
    await this.saveAsset(asset);
    return asset;
  }

  async importRemoteAsset(sourceUrl: string) {
    const asset = await this.storage.importRemoteImage(sourceUrl);
    await this.saveAsset(asset);
    return asset;
  }

  async ingestArticle(payload: IngestArticleRequest): Promise<IngestArticleResponse> {
    const category = await this.prisma.category.findUnique({
      where: { slug: payload.categorySlug },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const rewrittenBlocks: ArticleBlock[] = [];
    for (const block of payload.blocks) {
      if (block.type === "image" && block.url.startsWith("http")) {
        const asset = await this.importRemoteAsset(block.url);
        rewrittenBlocks.push({
          ...block,
          assetId: asset.id,
          url: asset.url,
        });
      } else {
        rewrittenBlocks.push(block);
      }
    }

    const coverAsset = payload.coverImage?.sourceUrl
      ? await this.importRemoteAsset(payload.coverImage.sourceUrl)
      : null;

    const existing = await this.prisma.article.findFirst({
      where: {
        OR: [
          { sourceUrl: payload.sourceUrl },
          ...(payload.ingestSource && payload.externalId
            ? [{ ingestSource: payload.ingestSource, externalId: payload.externalId }]
            : []),
        ],
      },
      include: {
        category: true,
        coverAsset: true,
      },
    });
    const slug = await this.ensureUniqueArticleSlug(payload.slug || createSlug(payload.title), existing?.id);
    const status = payload.publishMode === "review" ? "DRAFT" : "PUBLISHED";
    const reviewStatus =
      payload.reviewStatus ??
      (payload.publishMode === "review"
        ? "PENDING"
        : payload.kind === "CURATED"
          ? "APPROVED"
          : null);

    const article = existing
      ? await this.prisma.article.update({
          where: { id: existing.id },
          data: {
            slug,
            title: payload.title,
            excerpt: payload.excerpt,
            lede: payload.lede,
            kind: payload.kind,
            status,
            tone: payload.tone,
            categoryId: category.id,
            publishedAt:
              status === "PUBLISHED"
                ? payload.publishedAt
                  ? new Date(payload.publishedAt)
                  : existing.publishedAt ?? new Date()
                : existing.publishedAt,
            readingTime: payload.readingTime,
            authorDisplayName: payload.authorDisplayName,
            authorRoleLabel: payload.authorRoleLabel,
            highlights: payload.highlights,
            contentBlocks: rewrittenBlocks,
            coverAssetId: coverAsset?.id ?? existing.coverAssetId,
            externalId: payload.externalId ?? existing.externalId,
            sourceUrl: payload.sourceUrl,
            sourceTitle: payload.sourceTitle ?? payload.title,
            sourceAuthor: payload.sourceAuthor ?? payload.authorDisplayName,
            sourcePublishedAt: payload.sourcePublishedAt ? new Date(payload.sourcePublishedAt) : null,
            ingestSource: payload.ingestSource ?? existing.ingestSource,
            ingestScore: payload.ingestScore ?? existing.ingestScore,
            reviewStatus,
            originalLanguage: payload.originalLanguage ?? existing.originalLanguage,
            rewriteMode: payload.rewriteMode ?? existing.rewriteMode,
            sourceTrail:
              payload.sourceTrail.length > 0
                ? payload.sourceTrail
                : (existing.sourceTrail ?? Prisma.JsonNull),
          },
        })
      : await this.prisma.article.create({
          data: {
            slug,
            title: payload.title,
            excerpt: payload.excerpt,
            lede: payload.lede,
            kind: payload.kind,
            status,
            tone: payload.tone,
            categoryId: category.id,
            publishedAt: status === "PUBLISHED" ? (payload.publishedAt ? new Date(payload.publishedAt) : new Date()) : null,
            readingTime: payload.readingTime,
            authorDisplayName: payload.authorDisplayName,
            authorRoleLabel: payload.authorRoleLabel,
            highlights: payload.highlights,
            contentBlocks: rewrittenBlocks,
            coverAssetId: coverAsset?.id ?? null,
            externalId: payload.externalId ?? null,
            sourceUrl: payload.sourceUrl,
            sourceTitle: payload.sourceTitle ?? payload.title,
            sourceAuthor: payload.sourceAuthor ?? payload.authorDisplayName,
            sourcePublishedAt: payload.sourcePublishedAt ? new Date(payload.sourcePublishedAt) : null,
            ingestSource: payload.ingestSource ?? null,
            ingestScore: payload.ingestScore ?? null,
            reviewStatus,
            originalLanguage: payload.originalLanguage ?? null,
            rewriteMode: payload.rewriteMode ?? null,
            sourceTrail: payload.sourceTrail,
          },
        });

    return {
      articleId: article.id,
      slug: article.slug,
      status: article.status,
      reviewStatus: article.reviewStatus,
    };
  }
}
