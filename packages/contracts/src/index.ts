import { z } from "zod";

export const categoryToneValues = ["pink", "blue", "green", "aurora"] as const;
export const categoryCoverAssetAssignmentFilterValues = ["all", "assigned", "unassigned"] as const;
export const siteLogoVariantValues = [
  "prototype",
  "prototype-minimal-glow",
  "aurora-pulse",
  "aurora-editorial",
  "aurora-script-lockup",
  "aurora-pill-brand",
] as const;
export const articleKindValues = ["ORIGINAL", "CURATED"] as const;
export const articleStatusValues = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;
export const reviewStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export const apiTokenScopeValues = ["ingest:publish"] as const;
export const homeIssueStatusValues = ["CURRENT", "ARCHIVED"] as const;
export const assetKindValues = ["GENERIC", "CATEGORY_COVER"] as const;
export const originalLanguageValues = ["zh", "en"] as const;
export const publishModeValues = ["auto", "review"] as const;
export const rewriteModeValues = [
  "multi-source-original",
  "single-source-translation-review",
  "single-source-curated-review",
] as const;

export const categoryToneSchema = z.enum(categoryToneValues);
export const categoryCoverAssetAssignmentFilterSchema = z.enum(categoryCoverAssetAssignmentFilterValues);
export const siteLogoVariantSchema = z.enum(siteLogoVariantValues);
export const articleKindSchema = z.enum(articleKindValues);
export const articleStatusSchema = z.enum(articleStatusValues);
export const reviewStatusSchema = z.enum(reviewStatusValues);
export const apiTokenScopeSchema = z.enum(apiTokenScopeValues);
export const homeIssueStatusSchema = z.enum(homeIssueStatusValues);
export const assetKindSchema = z.enum(assetKindValues);
export const originalLanguageSchema = z.enum(originalLanguageValues);
export const publishModeSchema = z.enum(publishModeValues);
export const rewriteModeSchema = z.enum(rewriteModeValues);
export const objectStorageDriverSchema = z.enum(["local", "s3"]);
export const objectStorageProviderSchema = z.enum(["generic", "aws", "r2", "minio"]);

export type CategoryTone = z.infer<typeof categoryToneSchema>;
export type CategoryCoverAssetAssignmentFilter = z.infer<typeof categoryCoverAssetAssignmentFilterSchema>;
export type SiteLogoVariant = z.infer<typeof siteLogoVariantSchema>;
export type ArticleKind = z.infer<typeof articleKindSchema>;
export type ArticleStatus = z.infer<typeof articleStatusSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ApiTokenScope = z.infer<typeof apiTokenScopeSchema>;
export type HomeIssueStatus = z.infer<typeof homeIssueStatusSchema>;
export type AssetKind = z.infer<typeof assetKindSchema>;
export type OriginalLanguage = z.infer<typeof originalLanguageSchema>;
export type PublishMode = z.infer<typeof publishModeSchema>;
export type RewriteMode = z.infer<typeof rewriteModeSchema>;
export type ObjectStorageDriver = z.infer<typeof objectStorageDriverSchema>;
export type ObjectStorageProvider = z.infer<typeof objectStorageProviderSchema>;

const headingBlockSchema = z.object({
  id: z.string(),
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1),
});

const paragraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  text: z.string().min(1),
});

const imageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  assetId: z.string().min(1).optional(),
  url: z.string(),
  alt: z.string().default(""),
  caption: z.string().default(""),
  layout: z.enum(["normal", "full", "half"]).optional(),
});

const quoteBlockSchema = z.object({
  id: z.string(),
  type: z.literal("quote"),
  text: z.string().min(1),
  citation: z.string().default(""),
});

const listBlockSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  style: z.enum(["bullet", "ordered"]),
  items: z.array(z.string().min(1)).min(1),
});

const codeBlockSchema = z.object({
  id: z.string(),
  type: z.literal("code"),
  language: z.string().default("text"),
  code: z.string().min(1),
});

const dividerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("divider"),
});

export const articleBlockSchema = z.discriminatedUnion("type", [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  quoteBlockSchema,
  listBlockSchema,
  codeBlockSchema,
  dividerBlockSchema,
]);

export type ArticleBlock = z.infer<typeof articleBlockSchema>;

export const assetSchema = z.object({
  id: z.string(),
  storageKey: z.string(),
  url: z.string().url(),
  mimeType: z.string(),
  kind: assetKindSchema.default("GENERIC"),
  tone: categoryToneSchema.nullable().default(null),
  label: z.string().nullable().default(null),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  sourceUrl: z.string().url().nullable(),
  createdAt: z.string(),
});

export type Asset = z.infer<typeof assetSchema>;

export const articleSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  lede: z.string(),
  kind: articleKindSchema,
  tone: categoryToneSchema,
  publishedAt: z.string(),
  readingTime: z.string(),
  categorySlug: z.string(),
  categoryName: z.string(),
  authorDisplayName: z.string(),
  authorRoleLabel: z.string(),
  coverUrl: z.string().nullable(),
  sourceUrl: z.string().url().nullable(),
});

export type ArticleSummary = z.infer<typeof articleSummarySchema>;

export const categorySummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  coverUrl: z.string().min(1).nullable().default(null),
  coverAssetId: z.string().nullable().default(null),
  articleCountLabel: z.string(),
  tone: categoryToneSchema,
  heroTitle: z.string(),
  curatorNote: z.string(),
  focusAreas: z.array(z.string()),
  featuredArticleSlug: z.string().nullable(),
  sortOrder: z.number().int(),
});

export type CategorySummary = z.infer<typeof categorySummarySchema>;

export const adminCategorySchema = categorySummarySchema.extend({
  longSummary: z.string(),
});

export type AdminCategory = z.infer<typeof adminCategorySchema>;

export type PublicArticleSummary = z.infer<typeof articleSummarySchema>;

export const publicSearchResponseSchema = z.object({
  articles: z.array(articleSummarySchema),
});

export type PublicSearchResponse = z.infer<typeof publicSearchResponseSchema>;

export const getPublicHomeResponseSchema = z.object({

  categoryShelves: z.array(categorySummarySchema),
  latestOriginals: z.array(articleSummarySchema),
  latestCurated: z.array(articleSummarySchema),
});

export type PublicHomeResponse = z.infer<typeof getPublicHomeResponseSchema>;

export const publicSiteBrandingResponseSchema = z.object({
  logoVariant: siteLogoVariantSchema,
});

export type PublicSiteBrandingResponse = z.infer<typeof publicSiteBrandingResponseSchema>;

export const publicCategoryDetailSchema = z.object({
  category: categorySummarySchema.extend({
    longSummary: z.string(),
  }),
  articles: z.array(articleSummarySchema),
});

export type PublicCategoryDetail = z.infer<typeof publicCategoryDetailSchema>;

export const publicArticleDetailSchema = articleSummarySchema.extend({
  highlights: z.array(z.string()),
  blocks: z.array(articleBlockSchema),
  related: z.array(articleSummarySchema),
});

export type PublicArticleDetail = z.infer<typeof publicArticleDetailSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
  }),
});

export const adminTokenSchema = z.object({
  id: z.string(),
  label: z.string(),
  scopes: z.array(apiTokenScopeSchema),
  prefix: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export type AdminToken = z.infer<typeof adminTokenSchema>;

export const articleSourceTrailItemSchema = z.object({
  sourceType: z.enum(["rss", "blog", "media", "wechat"]),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  language: originalLanguageSchema.nullable().optional(),
  role: z.enum(["primary", "supporting"]),
});

export type ArticleSourceTrailItem = z.infer<typeof articleSourceTrailItemSchema>;

export const adminArticleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string().min(1, "标题不能为空"),
  excerpt: z.string().min(1, "摘要不能为空"),
  lede: z.string().min(1, "导语不能为空"),
  kind: articleKindSchema,
  status: articleStatusSchema,
  tone: categoryToneSchema,
  categoryId: z.string().min(1, "请选择分类"),
  categorySlug: z.string(),
  publishedAt: z.string().nullable(),
  readingTime: z.string().min(1, "请填写阅读时间"),
  authorDisplayName: z.string().min(1, "请填写作者显示名"),
  authorRoleLabel: z.string().min(1, "请填写作者角色"),
  highlights: z.array(z.string()),
  blocks: z.array(articleBlockSchema),
  coverAssetId: z.string().nullable(),
  coverUrl: z.string().nullable(),
  sourceUrl: z.string().url("来源 URL 格式不正确").nullable(),
  sourceTitle: z.string().nullable(),
  sourceAuthor: z.string().nullable(),
  sourcePublishedAt: z.string().nullable(),
  externalId: z.string().nullable().default(null),
  ingestSource: z.string().nullable().default(null),
  ingestScore: z.number().min(0).max(1).nullable().default(null),
  reviewStatus: reviewStatusSchema.nullable().default(null),
  originalLanguage: originalLanguageSchema.nullable().default(null),
  rewriteMode: rewriteModeSchema.nullable().default(null),
  sourceTrail: z.array(articleSourceTrailItemSchema).default([]),
});

export type AdminArticle = z.infer<typeof adminArticleSchema>;

export const adminArticleListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  items: z.array(adminArticleSchema),
});

export type AdminArticleListResponse = z.infer<typeof adminArticleListResponseSchema>;

export const upsertArticleRequestSchema = adminArticleSchema
  .omit({
    id: true,
    categorySlug: true,
    publishedAt: true,
    status: true,
    coverUrl: true,
    externalId: true,
    ingestSource: true,
    ingestScore: true,
    reviewStatus: true,
    originalLanguage: true,
    rewriteMode: true,
    sourceTrail: true,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "CURATED" && !value.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrl"],
        message: "收录整理文章需要填写有效的来源 URL",
      });
    }
  });

export type UpsertArticleRequest = z.infer<typeof upsertArticleRequestSchema>;

export const upsertCategoryRequestSchema = adminCategorySchema.omit({
  id: true,
  articleCountLabel: true,
});

export type UpsertCategoryRequest = z.infer<typeof upsertCategoryRequestSchema>;

export const createTokenRequestSchema = z.object({
  label: z.string().min(1),
  scopes: z.array(apiTokenScopeSchema).min(1),
});

export const createTokenResponseSchema = z.object({
  token: adminTokenSchema,
  plainTextToken: z.string(),
});

export const adminImportAssetRequestSchema = z.object({
  sourceUrl: z.string().url(),
});

export type AdminImportAssetRequest = z.infer<typeof adminImportAssetRequestSchema>;

export const categoryCoverAssetInputSchema = z.object({
  assetId: z.string().min(1),
  tone: categoryToneSchema,
  label: z.string().trim().min(1).nullable().optional(),
});

export type CategoryCoverAssetInput = z.infer<typeof categoryCoverAssetInputSchema>;

export const categoryCoverAssetSummarySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  tone: categoryToneSchema.nullable(),
  label: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  createdAt: z.string(),
  isAssigned: z.boolean(),
  assignedCategoryId: z.string().nullable(),
  assignedCategoryName: z.string().nullable(),
  assignedCategorySlug: z.string().nullable(),
});

export type CategoryCoverAssetSummary = z.infer<typeof categoryCoverAssetSummarySchema>;

export const categoryCoverAssetListFiltersSchema = z.object({
  tone: categoryToneSchema.optional(),
  assignment: categoryCoverAssetAssignmentFilterSchema.default("all"),
});

export type CategoryCoverAssetListFilters = z.infer<typeof categoryCoverAssetListFiltersSchema>;

export const categoryCoverAssetListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  items: z.array(categoryCoverAssetSummarySchema),
});

export type CategoryCoverAssetListResponse = z.infer<typeof categoryCoverAssetListResponseSchema>;

export const categoryCoverAssetImportResultSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  items: z.array(categoryCoverAssetSummarySchema),
});

export type CategoryCoverAssetImportResult = z.infer<typeof categoryCoverAssetImportResultSchema>;

export const adminPresignAssetUploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export const adminCompleteAssetUploadRequestSchema = z.object({
  token: z.string().min(1),
});

export const adminPresignAssetUploadResponseSchema = z.object({
  asset: assetSchema,
  upload: z.object({
    url: z.string().url(),
    method: z.literal("PUT"),
    headers: z.record(z.string(), z.string()),
    completeUrl: z.string().url(),
    token: z.string(),
    expiresAt: z.string(),
  }),
});

export type AdminPresignAssetUploadRequest = z.infer<typeof adminPresignAssetUploadRequestSchema>;
export type AdminCompleteAssetUploadRequest = z.infer<typeof adminCompleteAssetUploadRequestSchema>;
export type AdminPresignAssetUploadResponse = z.infer<typeof adminPresignAssetUploadResponseSchema>;

export const adminObjectStorageStatusSchema = z.object({
  driver: objectStorageDriverSchema,
  provider: objectStorageProviderSchema.nullable(),
  bucket: z.string().nullable(),
  endpoint: z.string().nullable(),
  publicBaseUrl: z.string().nullable(),
  forcePathStyle: z.boolean().nullable(),
  maxUploadBytes: z.number().int().positive(),
  diagnostics: z.object({
    ready: z.boolean(),
    missingEnv: z.array(z.string()),
    warnings: z.array(z.string()),
    hints: z.array(z.string()),
    samplePublicUrl: z.string().nullable(),
    uploadFlowLabel: z.string(),
  }),
  liveCheck: z.object({
    ok: z.boolean(),
    writable: z.boolean(),
    publicReadable: z.boolean(),
    checkedAt: z.string(),
    durationMs: z.number().int().nonnegative(),
    message: z.string(),
  }),
});

export type AdminObjectStorageStatus = z.infer<typeof adminObjectStorageStatusSchema>;

export const adminObjectStorageProbeStepSchema = z.object({
  key: z.enum(["prepare", "preflight", "upload", "complete", "public-read", "cleanup"]),
  label: z.string(),
  ok: z.boolean(),
  statusCode: z.number().int().nullable(),
  message: z.string(),
});

export const adminObjectStorageUploadProbeSchema = z.object({
  ok: z.boolean(),
  driver: objectStorageDriverSchema,
  provider: objectStorageProviderSchema.nullable(),
  checkedAt: z.string(),
  durationMs: z.number().int().nonnegative(),
  assetUrl: z.string().url().nullable(),
  summary: z.string(),
  steps: z.array(adminObjectStorageProbeStepSchema),
});

export type AdminObjectStorageUploadProbe = z.infer<typeof adminObjectStorageUploadProbeSchema>;

export const homeIssueSchema = z.object({
  id: z.string(),
  issueNumber: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  lede: z.string(),
  note: z.string().nullable(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: z.string(),
  secondaryCtaLabel: z.string(),
  secondaryCtaHref: z.string(),
  stats: z.array(z.string()),
  logoVariant: siteLogoVariantSchema.default("prototype"),
  heroArticleIds: z.object({
    main: z.string(),
    side1: z.string(),
    side2: z.string(),
  }),
});

export type HomeIssue = z.infer<typeof homeIssueSchema>;

export const updateHomeIssueRequestSchema = homeIssueSchema.omit({ id: true });

export const remoteImageSchema = z.object({
  sourceUrl: z.string().url(),
  alt: z.string().default(""),
});

export const ingestArticleRequestSchema = z.object({
  externalId: z.string().min(1).optional(),
  kind: articleKindSchema.default("CURATED"),
  publishMode: publishModeSchema.default("auto"),
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  excerpt: z.string().min(1),
  lede: z.string().min(1),
  tone: categoryToneSchema,
  categorySlug: z.string().min(1),
  readingTime: z.string().min(1),
  authorDisplayName: z.string().min(1),
  authorRoleLabel: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  blocks: z.array(articleBlockSchema),
  coverImage: remoteImageSchema.nullable().optional(),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1).optional(),
  sourceAuthor: z.string().min(1).optional(),
  sourcePublishedAt: z.string().optional(),
  publishedAt: z.string().optional(),
  ingestSource: z.string().min(1).optional(),
  ingestScore: z.number().min(0).max(1).optional(),
  originalLanguage: originalLanguageSchema.optional(),
  rewriteMode: rewriteModeSchema.optional(),
  reviewStatus: reviewStatusSchema.optional(),
  sourceTrail: z.array(articleSourceTrailItemSchema).default([]),
});

export type IngestArticleRequest = z.infer<typeof ingestArticleRequestSchema>;

export const ingestArticleResponseSchema = z.object({
  articleId: z.string(),
  slug: z.string(),
  status: articleStatusSchema,
  reviewStatus: reviewStatusSchema.nullable().default(null),
});

export type IngestArticleResponse = z.infer<typeof ingestArticleResponseSchema>;
