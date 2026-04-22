import type {
  AdminArticle,
  AdminCategory,
  AdminToken,
  Asset,
  IngestArticleRequest,
  IngestArticleResponse,
  PublicArticleDetail,
  PublicCategoryDetail,
  PublicHomeResponse,
  PublicSearchResponse,
  PublicSiteBrandingResponse,
  UpsertArticleRequest,
  UpsertCategoryRequest,
} from "@xblog/contracts";

export type StoreAdminUser = {
  id: string;
  email: string;
  displayName: string;
};

export type StoreSession = {
  id: string;
  sessionToken: string;
  userId: string;
  expiresAt: string;
};

export type UpsertCategoryPayload = UpsertCategoryRequest & {
  id?: string;
};

export interface Store {
  listCategories(): Promise<AdminCategory[]>;
  getCategoryBySlug(slug: string): Promise<AdminCategory | null>;
  listArticles(): Promise<AdminArticle[]>;
  getArticleBySlug(slug: string): Promise<AdminArticle | null>;
  getArticleById(id: string): Promise<AdminArticle | null>;
  authenticateAdmin(email: string, password: string): Promise<StoreAdminUser | null>;
  createSession(userId: string): Promise<StoreSession>;
  getSession(sessionToken: string): Promise<{ session: StoreSession; user: StoreAdminUser } | null>;
  deleteSession(sessionToken: string): Promise<void>;
  listTokens(): Promise<AdminToken[]>;
  createToken(
    label: string,
    scopes: AdminToken["scopes"],
  ): Promise<{ token: AdminToken; plainTextToken: string }>;
  revokeToken(id: string): Promise<AdminToken | null>;
  deleteToken(id: string): Promise<AdminToken | null>;
  findToken(rawToken: string): Promise<AdminToken | null>;
  getPublicHome(): Promise<PublicHomeResponse>;
  getPublicSiteBranding(): Promise<PublicSiteBrandingResponse>;
  getPublicCategoryDetail(slug: string): Promise<PublicCategoryDetail | null>;
  getPublicArticleDetail(slug: string): Promise<PublicArticleDetail | null>;
  searchPublicArticles(query: string): Promise<PublicSearchResponse>;
  upsertCategory(payload: UpsertCategoryPayload): Promise<AdminCategory>;
  upsertArticle(payload: UpsertArticleRequest & { id?: string }): Promise<AdminArticle>;
  deleteCategory(id: string): Promise<AdminCategory | null>;
  deleteArticle(id: string): Promise<AdminArticle | null>;
  publishArticle(id: string): Promise<AdminArticle | null>;
  hideArticle(id: string): Promise<AdminArticle | null>;
  saveAsset(asset: Asset): Promise<Asset>;
  uploadAsset(buffer: Buffer, fileName: string, mimeType?: string): Promise<Asset>;
  importRemoteAsset(sourceUrl: string): Promise<Asset>;
  ingestArticle(payload: IngestArticleRequest): Promise<IngestArticleResponse>;
}
