import fs from "node:fs/promises";
import type {
  AdminToken,
  Asset,
  ArticleBlock,
  CategoryCoverAssetListFilters,
  CategoryCoverAssetInput,
  CategoryCoverAssetImportResult,
  HomeIssue,
  IngestArticleRequest,
  PublicArticleDetail,
  PublicCategoryDetail,
  PublicHomeResponse,
  PublicSiteBrandingResponse,
  UpsertArticleRequest,
} from "@xblog/contracts";
import { buildBootstrapState, type BootstrapState, type StoredArticle, type StoredCategory } from "@/bootstrap/bootstrap";
import { getBuiltInCategoryCoverLibrary } from "@/lib/category-cover-library";
import { sortDateDesc } from "@/lib/dates";
import { getObjectStorage, type ObjectStorage } from "@/lib/object-storage";
import { createSlug, ensureUniqueSlug } from "@/lib/slug";
import { randomId, randomToken, sha256, verifyPassword } from "@/lib/security";
import type { Store, UpsertCategoryPayload } from "@/repositories/store";

export class MemoryStore implements Store {
  private constructor(
    private readonly storage: ObjectStorage,
    private state: BootstrapState,
  ) {}

  static async create() {
    return new MemoryStore(getObjectStorage(), await buildBootstrapState());
  }

  private articleCountLabel(categoryId: string) {
    const articleCount = this.state.articles.filter((entry) => entry.categoryId === categoryId).length;
    return `${articleCount} 篇文章`;
  }

  private hashSlug(slug: string) {
    let hash = 0;

    for (let index = 0; index < slug.length; index += 1) {
      hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
    }

    return hash;
  }

  private categoryCoverAssets() {
    return [...this.state.assets]
      .filter((asset) => asset.kind === "CATEGORY_COVER")
      .sort((a, b) => Date.parse(a.createdAt ?? "") - Date.parse(b.createdAt ?? ""));
  }

  private resolveCategoryCoverUrls(categories: StoredCategory[]) {
    const coverAssets = this.categoryCoverAssets();
    const manualAssignments = new Set(categories.map((category) => category.coverAssetId).filter(Boolean));
    const unusedAssets = coverAssets.filter((asset) => !manualAssignments.has(asset.id));
    const usedAutoAssetIds = new Set<string>();
    const resolved = new Map<string, string | null>();

    for (const category of [...categories].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (category.coverAssetId) {
        const asset = coverAssets.find((entry) => entry.id === category.coverAssetId);
        resolved.set(category.id, asset?.url ?? category.coverUrl ?? null);
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

  private toCategoryCoverAssetSummary(asset: Asset) {
    const assignedCategory = this.state.categories.find((category) => category.coverAssetId === asset.id) ?? null;

    return {
      id: asset.id,
      url: asset.url,
      tone: asset.tone,
      label: asset.label,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,
      isAssigned: Boolean(assignedCategory),
      assignedCategoryId: assignedCategory?.id ?? null,
      assignedCategoryName: assignedCategory?.name ?? null,
      assignedCategorySlug: assignedCategory?.slug ?? null,
    };
  }

  private toStoredCategory(category: StoredCategory, resolvedCoverUrl?: string | null): StoredCategory {
    return {
      ...category,
      coverUrl: resolvedCoverUrl ?? category.coverUrl,
      articleCountLabel: this.articleCountLabel(category.id),
    };
  }

  async saveAsset(asset: Asset) {
    const index = this.state.assets.findIndex((entry) => entry.id === asset.id);
    if (index === -1) {
      this.state.assets.push(asset);
      return asset;
    }

    this.state.assets[index] = asset;
    return asset;
  }

  async listCategories() {
    const categories = [...this.state.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const resolvedCoverUrls = this.resolveCategoryCoverUrls(categories);

    return categories.map((entry) => this.toStoredCategory(entry, resolvedCoverUrls.get(entry.id)));
  }

  async getCategoryBySlug(slug: string) {
    const categories = await this.listCategories();
    return categories.find((entry) => entry.slug === slug) ?? null;
  }

  async listArticles() {
    return [...this.state.articles];
  }

  async getArticleBySlug(slug: string) {
    return this.state.articles.find((entry) => entry.slug === slug) ?? null;
  }

  async getArticleById(id: string) {
    return this.state.articles.find((entry) => entry.id === id) ?? null;
  }

  async authenticateAdmin(email: string, password: string) {
    const user = this.state.users.find((entry) => entry.email === email);
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
    };
  }

  async createSession(userId: string) {
    const session = {
      id: randomId(),
      sessionToken: randomToken("xbs"),
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    };
    this.state.sessions.push(session);
    return session;
  }

  async getSession(sessionToken: string) {
    const session = this.state.sessions.find((entry) => entry.sessionToken === sessionToken);
    if (!session) {
      return null;
    }
    if (Date.parse(session.expiresAt) < Date.now()) {
      await this.deleteSession(sessionToken);
      return null;
    }
    const user = this.state.users.find((entry) => entry.id === session.userId);
    if (!user) {
      return null;
    }
    return {
      session,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async deleteSession(sessionToken: string) {
    this.state = {
      ...this.state,
      sessions: this.state.sessions.filter((entry) => entry.sessionToken !== sessionToken),
    };
  }

  async listTokens() {
    return this.state.tokens.map(({ tokenHash: _tokenHash, ...token }) => token);
  }

  async createToken(label: string, scopes: AdminToken["scopes"]) {
    const plainTextToken = randomToken("xbt");
    const tokenHash = sha256(plainTextToken);
    const token: AdminToken = {
      id: randomId(),
      label,
      scopes,
      prefix: plainTextToken.slice(0, 12),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    this.state.tokens.push({
      ...token,
      tokenHash,
    });

    return {
      token,
      plainTextToken,
    };
  }

  async revokeToken(id: string) {
    const token = this.state.tokens.find((entry) => entry.id === id);
    if (!token) {
      return null;
    }
    token.isActive = false;
    const { tokenHash: _tokenHash, ...safeToken } = token;
    return safeToken;
  }

  async deleteToken(id: string) {
    const index = this.state.tokens.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return null;
    }

    const [deleted] = this.state.tokens.splice(index, 1);
    const { tokenHash: _tokenHash, ...safeToken } = deleted;
    return safeToken;
  }

  async findToken(rawToken: string) {
    const prefix = rawToken.slice(0, 12);
    const tokenHash = sha256(rawToken);
    const token = this.state.tokens.find(
      (entry) => entry.prefix === prefix && entry.tokenHash === tokenHash && entry.isActive,
    );
    if (!token) {
      return null;
    }
    token.lastUsedAt = new Date().toISOString();
    const { tokenHash: _tokenHash, ...safeToken } = token;
    return safeToken;
  }

  private toArticleSummary(article: StoredArticle) {
    const category = this.state.categories.find((entry) => entry.id === article.categoryId);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      lede: article.lede,
      kind: article.kind,
      tone: article.tone,
      publishedAt: article.publishedAt ?? "",
      readingTime: article.readingTime,
      categorySlug: category?.slug ?? article.categorySlug,
      categoryName: category?.name ?? "",
      authorDisplayName: article.authorDisplayName,
      authorRoleLabel: article.authorRoleLabel,
      coverUrl: article.coverUrl,
      sourceUrl: article.sourceUrl,
    };
  }

  private visibleArticles() {
    return this.state.articles.filter((article) => article.status === "PUBLISHED");
  }

  async getPublicHome(): Promise<PublicHomeResponse> {
    const visible = this.visibleArticles();
    const originals = sortDateDesc(visible.filter((entry) => entry.kind === "ORIGINAL"), (entry) => entry.publishedAt).slice(0, 3);
    const curated = sortDateDesc(visible.filter((entry) => entry.kind === "CURATED"), (entry) => entry.publishedAt).slice(0, 3);
    const categoryShelves = await this.listCategories();
    const categoryCoverLibrary = this.categoryCoverAssets();

    const heroSlots = [
      { slot: "main" as const, articleId: this.state.homeIssue.heroArticleIds.main },
      { slot: "side-1" as const, articleId: this.state.homeIssue.heroArticleIds.side1 },
      { slot: "side-2" as const, articleId: this.state.homeIssue.heroArticleIds.side2 },
    ].map((entry) => ({
      slot: entry.slot,
      article: this.toArticleSummary(visible.find((item) => item.id === entry.articleId) ?? visible[0]),
    }));

    return {
      issue: this.state.homeIssue,
      heroSlots,
      categoryShelves,
      categoryCoverLibrary: {
        total: categoryCoverLibrary.length,
        items: categoryCoverLibrary.slice(0, 20).map((asset) => ({
          id: asset.id,
          url: asset.url,
          tone: asset.tone,
        })),
      },
      latestOriginals: originals.map((entry) => this.toArticleSummary(entry)),
      latestCurated: curated.map((entry) => this.toArticleSummary(entry)),
    };
  }

  async getPublicSiteBranding(): Promise<PublicSiteBrandingResponse> {
    return {
      logoVariant: this.state.homeIssue.logoVariant,
    };
  }

  async getPublicCategoryDetail(slug: string): Promise<PublicCategoryDetail | null> {
    const category = await this.getCategoryBySlug(slug);
    if (!category) {
      return null;
    }

    return {
      category: {
        ...category,
        longSummary: category.longSummary,
      },
      articles: this.visibleArticles()
        .filter((article) => article.categoryId === category.id)
        .map((article) => this.toArticleSummary(article)),
    };
  }

  async getPublicArticleDetail(slug: string): Promise<PublicArticleDetail | null> {
    const article = await this.getArticleBySlug(slug);
    if (!article || article.status !== "PUBLISHED") {
      return null;
    }

    const related = this.visibleArticles()
      .filter((entry) => entry.categoryId === article.categoryId && entry.id !== article.id)
      .slice(0, 3)
      .map((entry) => this.toArticleSummary(entry));

    return {
      ...this.toArticleSummary(article),
      highlights: article.highlights,
      blocks: article.blocks,
      related,
    };
  }

  async listCategoryCoverAssets(
    page: number,
    pageSize: number,
    filters: CategoryCoverAssetListFilters = { assignment: "all" },
  ) {
    let assets = this.categoryCoverAssets();

    if (filters.tone) {
      assets = assets.filter((asset) => asset.tone === filters.tone);
    }

    const assignedAssetIds = new Set(
      this.state.categories.map((category) => category.coverAssetId).filter(Boolean),
    );

    if (filters.assignment === "assigned") {
      assets = assets.filter((asset) => assignedAssetIds.has(asset.id));
    }

    if (filters.assignment === "unassigned") {
      assets = assets.filter((asset) => !assignedAssetIds.has(asset.id));
    }

    const start = (page - 1) * pageSize;

    return {
      total: assets.length,
      page,
      pageSize,
      items: assets.slice(start, start + pageSize).map((asset) => this.toCategoryCoverAssetSummary(asset)),
    };
  }

  async createCategoryCoverAsset(payload: CategoryCoverAssetInput) {
    const asset = this.state.assets.find((entry) => entry.id === payload.assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    asset.kind = "CATEGORY_COVER";
    asset.tone = payload.tone;
    asset.label = payload.label ?? asset.label ?? null;
    return this.toCategoryCoverAssetSummary(asset);
  }

  async deleteCategoryCoverAsset(id: string) {
    const index = this.state.assets.findIndex((entry) => entry.id === id && entry.kind === "CATEGORY_COVER");
    if (index === -1) {
      return null;
    }

    const [asset] = this.state.assets.splice(index, 1);
    this.state.categories = this.state.categories.map((category) =>
      category.coverAssetId === asset.id
        ? {
            ...category,
            coverAssetId: null,
          }
        : category,
    );
    await this.storage.deleteObject(asset);
    return this.toCategoryCoverAssetSummary(asset);
  }

  async importBuiltInCategoryCoverAssets(): Promise<CategoryCoverAssetImportResult> {
    const library = getBuiltInCategoryCoverLibrary();
    const items = [];
    let imported = 0;
    let skipped = 0;

    for (const entry of library) {
      const existing = this.state.assets.find(
        (asset) => asset.kind === "CATEGORY_COVER" && asset.sourceUrl === entry.sourceUrl,
      );
      if (existing) {
        skipped += 1;
        items.push(this.toCategoryCoverAssetSummary(existing));
        continue;
      }

      const buffer = await fs.readFile(entry.absolutePath);
      const stored = await this.storage.storeBuffer(buffer, entry.fileName, entry.mimeType);
      const asset: Asset = {
        ...stored,
        kind: "CATEGORY_COVER",
        tone: entry.tone,
        label: entry.label,
        sourceUrl: entry.sourceUrl,
      };

      await this.saveAsset(asset);
      imported += 1;
      items.push(this.toCategoryCoverAssetSummary(asset));
    }

    return {
      imported,
      skipped,
      items,
    };
  }

  async upsertCategory(payload: UpsertCategoryPayload) {
    if (payload.coverAssetId) {
      const asset = this.state.assets.find((entry) => entry.id === payload.coverAssetId);
      if (!asset) {
        throw new Error("Asset not found");
      }

      const occupiedByAnotherCategory = this.state.categories.find(
        (entry) => entry.coverAssetId === payload.coverAssetId && entry.id !== payload.id,
      );
      if (occupiedByAnotherCategory) {
        throw new Error("Category cover asset is already assigned");
      }
    }

    if (!payload.id) {
      const created: StoredCategory = {
        ...payload,
        coverUrl: payload.coverAssetId ? null : payload.coverUrl,
        id: randomId(),
        articleCountLabel: "0 篇文章",
      };
      this.state.categories.push(created);
      return this.toStoredCategory(created);
    }

    const index = this.state.categories.findIndex((entry) => entry.id === payload.id);
    if (index === -1) {
      throw new Error("Category not found");
    }

    const updated: StoredCategory = {
      ...this.state.categories[index],
      ...payload,
      coverUrl: payload.coverAssetId ? null : payload.coverUrl,
      id: payload.id,
      articleCountLabel: this.articleCountLabel(payload.id),
    };
    this.state.categories[index] = updated;
    return this.toStoredCategory(updated);
  }

  async upsertArticle(payload: UpsertArticleRequest & { id?: string }) {
    const category = this.state.categories.find((entry) => entry.id === payload.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    const current = payload.id ? await this.getArticleById(payload.id) : null;
    const existingSlugs = new Set(this.state.articles.map((entry) => entry.slug));
    const slug = ensureUniqueSlug(payload.slug || createSlug(payload.title), existingSlugs, current?.slug);
    const coverAsset = payload.coverAssetId
      ? this.state.assets.find((entry) => entry.id === payload.coverAssetId) ?? null
      : null;

    const article: StoredArticle = {
      id: current?.id ?? randomId(),
      slug,
      title: payload.title,
      excerpt: payload.excerpt,
      lede: payload.lede,
      kind: payload.kind,
      status: current?.status ?? "DRAFT",
      tone: payload.tone,
      categoryId: category.id,
      categorySlug: category.slug,
      publishedAt: current?.publishedAt ?? null,
      readingTime: payload.readingTime,
      authorDisplayName: payload.authorDisplayName,
      authorRoleLabel: payload.authorRoleLabel,
      highlights: payload.highlights,
      blocks: payload.blocks,
      coverAssetId: payload.coverAssetId,
      coverUrl: payload.coverAssetId ? coverAsset?.url ?? current?.coverUrl ?? null : null,
      externalId: current?.externalId ?? null,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle,
      sourceAuthor: payload.sourceAuthor,
      sourcePublishedAt: payload.sourcePublishedAt,
      ingestSource: current?.ingestSource ?? null,
      ingestScore: current?.ingestScore ?? null,
      reviewStatus: current?.reviewStatus ?? null,
      originalLanguage: current?.originalLanguage ?? null,
      rewriteMode: current?.rewriteMode ?? null,
      sourceTrail: current?.sourceTrail ?? [],
    };

    if (current) {
      this.state.articles = this.state.articles.map((entry) => (entry.id === current.id ? article : entry));
      return article;
    }

    this.state.articles.push(article);
    return article;
  }

  async deleteCategory(id: string) {
    const category = this.state.categories.find((entry) => entry.id === id);
    if (!category) {
      return null;
    }

    const hasArticles = this.state.articles.some((entry) => entry.categoryId === id);
    if (hasArticles) {
      throw new Error("Category is not empty");
    }

    this.state.categories = this.state.categories.filter((entry) => entry.id !== id);
    return this.toStoredCategory(category);
  }

  async deleteArticle(id: string) {
    const article = this.state.articles.find((entry) => entry.id === id);
    if (!article) {
      return null;
    }

    const heroIds = Object.values(this.state.homeIssue.heroArticleIds);
    if (heroIds.includes(id)) {
      throw new Error("Article is used in home issue");
    }

    this.state.articles = this.state.articles.filter((entry) => entry.id !== id);
    return article;
  }

  async publishArticle(id: string) {
    const article = await this.getArticleById(id);
    if (!article) {
      return null;
    }
    article.status = "PUBLISHED";
    article.publishedAt = article.publishedAt ?? new Date().toISOString();
    article.reviewStatus = article.reviewStatus ? "APPROVED" : article.reviewStatus;
    return article;
  }

  async hideArticle(id: string) {
    const article = await this.getArticleById(id);
    if (!article) {
      return null;
    }
    article.status = "HIDDEN";
    return article;
  }

  async getHomeIssue() {
    return this.state.homeIssue;
  }

  async updateHomeIssue(payload: HomeIssue) {
    this.state.homeIssue = payload;
    return payload;
  }

  async uploadAsset(buffer: Buffer, fileName: string, mimeType?: string) {
    const asset = await this.storage.storeBuffer(buffer, fileName, mimeType);
    return this.saveAsset(asset);
  }

  async importRemoteAsset(sourceUrl: string) {
    const asset = await this.storage.importRemoteImage(sourceUrl);
    return this.saveAsset(asset);
  }

  async ingestArticle(payload: IngestArticleRequest) {
    const category = await this.getCategoryBySlug(payload.categorySlug);
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

    const existing = this.state.articles.find(
      (entry) =>
        entry.sourceUrl === payload.sourceUrl ||
        (payload.ingestSource &&
          payload.externalId &&
          entry.ingestSource === payload.ingestSource &&
          entry.externalId === payload.externalId),
    );
    const slug = ensureUniqueSlug(payload.slug || createSlug(payload.title), new Set(this.state.articles.map((entry) => entry.slug)), existing?.slug);
    const status = payload.publishMode === "review" ? "DRAFT" : "PUBLISHED";
    const reviewStatus =
      payload.reviewStatus ??
      (payload.publishMode === "review"
        ? "PENDING"
        : payload.kind === "CURATED"
          ? "APPROVED"
          : null);

    const article: StoredArticle = {
      id: existing?.id ?? randomId(),
      slug,
      title: payload.title,
      excerpt: payload.excerpt,
      lede: payload.lede,
      kind: payload.kind,
      status,
      tone: payload.tone,
      categoryId: category.id,
      categorySlug: category.slug,
      publishedAt: status === "PUBLISHED" ? payload.publishedAt ?? existing?.publishedAt ?? new Date().toISOString() : existing?.publishedAt ?? null,
      readingTime: payload.readingTime,
      authorDisplayName: payload.authorDisplayName,
      authorRoleLabel: payload.authorRoleLabel,
      highlights: payload.highlights,
      blocks: rewrittenBlocks,
      coverAssetId: coverAsset?.id ?? existing?.coverAssetId ?? null,
      coverUrl: coverAsset?.url ?? existing?.coverUrl ?? null,
      externalId: payload.externalId ?? existing?.externalId ?? null,
      sourceUrl: payload.sourceUrl,
      sourceTitle: payload.sourceTitle ?? payload.title,
      sourceAuthor: payload.sourceAuthor ?? payload.authorDisplayName,
      sourcePublishedAt: payload.sourcePublishedAt ?? null,
      ingestSource: payload.ingestSource ?? existing?.ingestSource ?? null,
      ingestScore: payload.ingestScore ?? existing?.ingestScore ?? null,
      reviewStatus,
      originalLanguage: payload.originalLanguage ?? existing?.originalLanguage ?? null,
      rewriteMode: payload.rewriteMode ?? existing?.rewriteMode ?? null,
      sourceTrail: payload.sourceTrail.length > 0 ? payload.sourceTrail : existing?.sourceTrail ?? [],
    };

    if (existing) {
      this.state.articles = this.state.articles.map((entry) => (entry.id === existing.id ? article : entry));
    } else {
      this.state.articles.push(article);
    }

    return {
      articleId: article.id,
      slug: article.slug,
      status: article.status,
      reviewStatus: article.reviewStatus,
    };
  }
}
