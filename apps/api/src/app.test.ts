import { describe, expect, it } from "vitest";

process.env.XBLOG_STORE_DRIVER = "memory";
process.env.OBJECT_STORAGE_DRIVER = "local";

async function createTestApp() {
  const { createApp } = await import("./app.js");
  return createApp();
}

describe("api", () => {
  it("renders public home payload", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/public/home",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.issue.title).toContain("极光");
    expect(body.issue.logoVariant).toBe("prototype");
    expect(body.heroSlots).toHaveLength(3);
  });

  it("exposes public site branding", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "GET",
      url: "/v1/public/site-branding",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().logoVariant).toBe("prototype");
  });

  it("supports admin login and token creation", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    expect(login.statusCode).toBe(200);
    const cookie = login.cookies[0];
    expect(cookie.name).toBe("xblog_admin_session");

    const createToken = await app.inject({
      method: "POST",
      url: "/v1/admin/tokens",
      cookies: {
        [cookie.name]: cookie.value,
      },
      payload: {
        label: "OpenClaw",
        scopes: ["ingest:publish"],
      },
    });

    expect(createToken.statusCode).toBe(200);
    expect(createToken.json().plainTextToken).toContain("xbt_");
  });

  it("rejects forged tokens that only match the prefix", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const createToken = await app.inject({
      method: "POST",
      url: "/v1/admin/tokens",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        label: "OpenClaw",
        scopes: ["ingest:publish"],
      },
    });

    const { plainTextToken } = createToken.json();
    const forgedToken = `${plainTextToken.slice(0, -1)}${plainTextToken.endsWith("0") ? "1" : "0"}`;

    const rejected = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${forgedToken}`,
      },
      payload: {
        title: "测试收录文章",
        excerpt: "摘要",
        lede: "导语",
        tone: "aurora",
        categorySlug: "ai-agent",
        readingTime: "3 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "OpenClaw",
        highlights: [],
        blocks: [{ id: "p1", type: "paragraph", text: "正文" }],
        sourceUrl: "https://example.com/forged-token-check",
      },
    });

    expect(rejected.statusCode).toBe(401);

    const accepted = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${plainTextToken}`,
      },
      payload: {
        title: "测试收录文章",
        excerpt: "摘要",
        lede: "导语",
        tone: "aurora",
        categorySlug: "ai-agent",
        readingTime: "3 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "OpenClaw",
        highlights: [],
        blocks: [{ id: "p1", type: "paragraph", text: "正文" }],
        sourceUrl: "https://example.com/forged-token-check",
      },
    });

    expect(accepted.statusCode).toBe(200);
    expect(accepted.json().status).toBe("PUBLISHED");
  });

  it("deletes tokens and invalidates future ingest calls", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const createToken = await app.inject({
      method: "POST",
      url: "/v1/admin/tokens",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        label: "Delete Me",
        scopes: ["ingest:publish"],
      },
    });

    expect(createToken.statusCode).toBe(200);
    const { token, plainTextToken } = createToken.json();

    const removeToken = await app.inject({
      method: "DELETE",
      url: `/v1/admin/tokens/${token.id}`,
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(removeToken.statusCode).toBe(200);
    expect(removeToken.json().id).toBe(token.id);

    const tokens = await app.inject({
      method: "GET",
      url: "/v1/admin/tokens",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(tokens.statusCode).toBe(200);
    expect(tokens.json().find((entry: { id: string }) => entry.id === token.id)).toBeUndefined();

    const rejected = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${plainTextToken}`,
      },
      payload: {
        title: "被删除令牌的收录",
        excerpt: "摘要",
        lede: "导语",
        tone: "aurora",
        categorySlug: "ai-agent",
        readingTime: "3 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "OpenClaw",
        highlights: [],
        blocks: [{ id: "p1", type: "paragraph", text: "正文" }],
        sourceUrl: "https://example.com/deleted-token-check",
      },
    });

    expect(rejected.statusCode).toBe(401);
  });

  it("stores review-mode ingest as a draft with pending review status", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const createToken = await app.inject({
      method: "POST",
      url: "/v1/admin/tokens",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        label: "OpenClaw Review",
        scopes: ["ingest:publish"],
      },
    });

    const { plainTextToken } = createToken.json();
    const ingest = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${plainTextToken}`,
      },
      payload: {
        kind: "CURATED",
        publishMode: "review",
        title: "英文技术稿的中文整理",
        excerpt: "一篇待审核的技术整理稿。",
        lede: "这篇稿件保留了来源追踪，并以待审核方式入库。",
        tone: "aurora",
        categorySlug: "ai-agent",
        readingTime: "4 分钟",
        authorDisplayName: "OpenClaw",
        authorRoleLabel: "Automation",
        highlights: ["保留来源追踪", "自动生成元信息"],
        blocks: [{ id: "p1", type: "paragraph", text: "正文内容" }],
        sourceUrl: "https://example.com/review-mode-article",
        ingestSource: "OpenAI News",
        ingestScore: 0.71,
        originalLanguage: "en",
        rewriteMode: "single-source-translation-review",
        sourceTrail: [
          {
            sourceType: "media",
            sourceName: "OpenAI News",
            sourceUrl: "https://example.com/review-mode-article",
            title: "Original article",
            author: "OpenAI",
            publishedAt: "2026-03-17T00:00:00.000Z",
            language: "en",
            role: "primary",
          },
        ],
      },
    });

    expect(ingest.statusCode).toBe(200);
    expect(ingest.json().status).toBe("DRAFT");
    expect(ingest.json().reviewStatus).toBe("PENDING");

    const stored = await app.store.getArticleById(ingest.json().articleId);
    expect(stored?.status).toBe("DRAFT");
    expect(stored?.reviewStatus).toBe("PENDING");
    expect(stored?.kind).toBe("CURATED");
    expect(stored?.sourceTrail).toHaveLength(1);
  });

  it("upserts ingest articles by ingestSource and externalId", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const createToken = await app.inject({
      method: "POST",
      url: "/v1/admin/tokens",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        label: "OpenClaw Original",
        scopes: ["ingest:publish"],
      },
    });

    const { plainTextToken } = createToken.json();
    const first = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${plainTextToken}`,
      },
      payload: {
        externalId: "topic-001",
        kind: "ORIGINAL",
        publishMode: "auto",
        title: "多源综合后的中文原创稿",
        excerpt: "一次由多来源汇总生成的原创稿。",
        lede: "系统自动汇总多源技术信息，并生成中文原创正文。",
        tone: "blue",
        categorySlug: "systems-design",
        readingTime: "5 分钟",
        authorDisplayName: "OpenClaw",
        authorRoleLabel: "Automation",
        highlights: ["多源综合", "自动发布"],
        blocks: [{ id: "p1", type: "paragraph", text: "第一版正文" }],
        sourceUrl: "https://example.com/original-source-a",
        ingestSource: "OpenClaw Daily",
        ingestScore: 0.91,
        originalLanguage: "zh",
        rewriteMode: "multi-source-original",
        sourceTrail: [
          {
            sourceType: "blog",
            sourceName: "GitHub Blog",
            sourceUrl: "https://example.com/original-source-a",
            title: "Source A",
            author: "GitHub",
            publishedAt: "2026-03-17T00:00:00.000Z",
            language: "en",
            role: "primary",
          },
          {
            sourceType: "blog",
            sourceName: "Cloudflare Blog",
            sourceUrl: "https://example.com/original-source-b",
            title: "Source B",
            author: "Cloudflare",
            publishedAt: "2026-03-17T01:00:00.000Z",
            language: "en",
            role: "supporting",
          },
        ],
      },
    });

    const second = await app.inject({
      method: "POST",
      url: "/v1/ingest/articles",
      headers: {
        authorization: `Bearer ${plainTextToken}`,
      },
      payload: {
        externalId: "topic-001",
        kind: "ORIGINAL",
        publishMode: "auto",
        title: "多源综合后的中文原创稿（更新）",
        excerpt: "更新后的原创摘要。",
        lede: "更新后的中文原创导语。",
        tone: "blue",
        categorySlug: "systems-design",
        readingTime: "6 分钟",
        authorDisplayName: "OpenClaw",
        authorRoleLabel: "Automation",
        highlights: ["多源综合", "自动发布", "更新"],
        blocks: [{ id: "p1", type: "paragraph", text: "第二版正文" }],
        sourceUrl: "https://example.com/original-source-a-v2",
        ingestSource: "OpenClaw Daily",
        ingestScore: 0.95,
        originalLanguage: "zh",
        rewriteMode: "multi-source-original",
        sourceTrail: [
          {
            sourceType: "blog",
            sourceName: "GitHub Blog",
            sourceUrl: "https://example.com/original-source-a-v2",
            title: "Source A v2",
            author: "GitHub",
            publishedAt: "2026-03-17T02:00:00.000Z",
            language: "en",
            role: "primary",
          },
        ],
      },
    });

    expect(first.statusCode).toBe(200);
    expect(first.json().status).toBe("PUBLISHED");
    expect(second.statusCode).toBe(200);
    expect(second.json().articleId).toBe(first.json().articleId);

    const articles = await app.store.listArticles();
    const merged = articles.find((entry) => entry.id === first.json().articleId);
    expect(merged?.title).toContain("更新");
    expect(merged?.kind).toBe("ORIGINAL");
    expect(merged?.ingestScore).toBe(0.95);
  });

  it("supports authenticated cover uploads", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const boundary = "xblog-upload-boundary";
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="file"; filename="cover.png"\r\n'),
      Buffer.from("Content-Type: image/png\r\n\r\n"),
      Buffer.from("fake-image-binary"),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const upload = await app.inject({
      method: "POST",
      url: "/v1/admin/assets/upload",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload,
    });

    expect(upload.statusCode).toBe(200);
    expect(upload.json().url).toContain("/uploads/");
    expect(upload.json().mimeType).toBe("image/png");
  });

  it("imports the built-in category cover library only once", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const firstImport = await app.inject({
      method: "POST",
      url: "/v1/admin/category-cover-assets/import-library",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(firstImport.statusCode).toBe(200);
    expect(firstImport.json().imported).toBe(20);
    expect(firstImport.json().skipped).toBe(0);

    const list = await app.inject({
      method: "GET",
      url: "/v1/admin/category-cover-assets?page=1&pageSize=20",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(list.statusCode).toBe(200);
    expect(list.json().total).toBe(20);

    const secondImport = await app.inject({
      method: "POST",
      url: "/v1/admin/category-cover-assets/import-library",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(secondImport.statusCode).toBe(200);
    expect(secondImport.json().imported).toBe(0);
    expect(secondImport.json().skipped).toBe(20);
  });

  it("filters category cover assets by tone and assignment", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    await app.inject({
      method: "POST",
      url: "/v1/admin/category-cover-assets/import-library",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    const importedAssets = await app.store.listCategoryCoverAssets(1, 20, { assignment: "all" });
    const assignedAsset = importedAssets.items.find((entry) => entry.tone === "green");
    expect(assignedAsset).toBeDefined();

    const firstCategory = (await app.store.listCategories())[0];
    await app.store.upsertCategory({
      id: firstCategory.id,
      slug: firstCategory.slug,
      name: firstCategory.name,
      summary: firstCategory.summary,
      coverUrl: null,
      coverAssetId: assignedAsset?.id ?? null,
      tone: firstCategory.tone,
      heroTitle: firstCategory.heroTitle,
      curatorNote: firstCategory.curatorNote,
      focusAreas: firstCategory.focusAreas,
      featuredArticleSlug: firstCategory.featuredArticleSlug,
      sortOrder: firstCategory.sortOrder,
      longSummary: firstCategory.longSummary,
    });

    const greenAssets = await app.inject({
      method: "GET",
      url: "/v1/admin/category-cover-assets?page=1&pageSize=20&tone=green",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(greenAssets.statusCode).toBe(200);
    expect(greenAssets.json().items.every((entry: { tone: string | null }) => entry.tone === "green")).toBe(true);

    const assignedAssets = await app.inject({
      method: "GET",
      url: "/v1/admin/category-cover-assets?page=1&pageSize=20&assignment=assigned",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(assignedAssets.statusCode).toBe(200);
    expect(assignedAssets.json().total).toBe(1);
    expect(assignedAssets.json().items[0].id).toBe(assignedAsset?.id);

    const unassignedAssets = await app.inject({
      method: "GET",
      url: "/v1/admin/category-cover-assets?page=1&pageSize=20&assignment=unassigned",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(unassignedAssets.statusCode).toBe(200);
    expect(unassignedAssets.json().total).toBe(19);
    expect(unassignedAssets.json().items.every((entry: { isAssigned: boolean }) => !entry.isAssigned)).toBe(true);
  });

  it("returns clear validation errors for invalid article payloads", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const save = await app.inject({
      method: "POST",
      url: "/v1/admin/articles",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        slug: "test-article",
        title: "测试标题",
        excerpt: "这是一篇测试",
        lede: "这是一篇测试",
        kind: "CURATED",
        tone: "pink",
        categoryId: "",
        readingTime: "6 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "Editor",
        highlights: ["这是一篇测试"],
        blocks: [],
        coverAssetId: null,
        sourceUrl: "这不是 url",
        sourceTitle: null,
        sourceAuthor: null,
        sourcePublishedAt: null,
      },
    });

    expect(save.statusCode).toBe(400);
    expect(save.json().message).toContain("请选择分类");
    expect(save.json().message).toContain("来源 URL 格式不正确");
  });

  it("creates an article from the admin editor payload shape", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const categories = await app.inject({
      method: "GET",
      url: "/v1/admin/categories",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });
    const firstCategoryId = categories.json()[0].id as string;

    const save = await app.inject({
      method: "POST",
      url: "/v1/admin/articles",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        slug: "test-article-from-editor",
        title: "测试标题",
        excerpt: "这是一篇测试",
        lede: "这是一篇测试",
        kind: "CURATED",
        tone: "pink",
        categoryId: firstCategoryId,
        readingTime: "6 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "Editor",
        highlights: ["这是一篇测试"],
        blocks: [],
        coverAssetId: null,
        sourceUrl: "https://example.com/test-article",
        sourceTitle: null,
        sourceAuthor: null,
        sourcePublishedAt: null,
      },
    });

    expect(save.statusCode).toBe(200);
    expect(save.json().status).toBe("DRAFT");
    expect(save.json().slug).toBe("test-article-from-editor");
  });

  it("returns paginated article library data for the admin article page", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const library = await app.inject({
      method: "GET",
      url: "/v1/admin/article-library?page=1&pageSize=2",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(library.statusCode).toBe(200);
    expect(library.json().page).toBe(1);
    expect(library.json().pageSize).toBe(2);
    expect(library.json().items).toHaveLength(2);
    expect(library.json().total).toBeGreaterThanOrEqual(2);
  });

  it("creates a category draft from the admin category library flow", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const createCategory = await app.inject({
      method: "POST",
      url: "/v1/admin/categories",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        slug: "design-systems",
        name: "设计系统",
        summary: "围绕界面语言和交互模式整理方法论。",
        tone: "aurora",
        heroTitle: "把前端视觉和交互收成同一套设计语法",
        curatorNote: "从组件语义、动画节奏到信息层级，统一成同一套策展视角。",
        longSummary: "用一套稳定的视觉和交互原则收纳前端细节，避免内容层和界面层割裂。",
        focusAreas: ["design system", "interaction"],
        featuredArticleSlug: null,
        sortOrder: 99,
      },
    });

    expect(createCategory.statusCode).toBe(200);
    expect(createCategory.json().name).toBe("设计系统");
    expect(createCategory.json().slug).toBe("design-systems");
    expect(createCategory.json().articleCountLabel).toBe("0 篇文章");
  });

  it("blocks deleting non-empty categories but allows deleting empty drafts", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const categories = await app.inject({
      method: "GET",
      url: "/v1/admin/categories",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    const populatedCategoryId = categories.json()[0].id as string;
    const populatedDelete = await app.inject({
      method: "DELETE",
      url: `/v1/admin/categories/${populatedCategoryId}`,
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(populatedDelete.statusCode).toBe(409);
    expect(populatedDelete.json().message).toContain("分类下还有文章");

    const createCategory = await app.inject({
      method: "POST",
      url: "/v1/admin/categories",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        slug: "temp-delete-category",
        name: "待删除分类",
        summary: "用于删除测试",
        tone: "aurora",
        heroTitle: "待删除分类 Hero",
        curatorNote: "测试删除",
        longSummary: "测试删除",
        focusAreas: [],
        featuredArticleSlug: null,
        sortOrder: 999,
      },
    });

    const emptyCategoryId = createCategory.json().id as string;
    const emptyDelete = await app.inject({
      method: "DELETE",
      url: `/v1/admin/categories/${emptyCategoryId}`,
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(emptyDelete.statusCode).toBe(200);
    expect(emptyDelete.json().id).toBe(emptyCategoryId);
  });

  it("blocks deleting home-issue articles but allows deleting ordinary drafts", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const homeIssue = await app.inject({
      method: "GET",
      url: "/v1/admin/home-issue/current",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    const protectedArticleId = homeIssue.json().heroArticleIds.main as string;
    const protectedDelete = await app.inject({
      method: "DELETE",
      url: `/v1/admin/articles/${protectedArticleId}`,
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(protectedDelete.statusCode).toBe(409);
    expect(protectedDelete.json().message).toContain("首页刊期");

    const categories = await app.inject({
      method: "GET",
      url: "/v1/admin/categories",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });
    const firstCategoryId = categories.json()[0].id as string;

    const createArticle = await app.inject({
      method: "POST",
      url: "/v1/admin/articles",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        slug: "temp-delete-article",
        title: "待删除文章",
        excerpt: "用于删除测试",
        lede: "用于删除测试",
        kind: "ORIGINAL",
        tone: "aurora",
        categoryId: firstCategoryId,
        readingTime: "3 分钟",
        authorDisplayName: "Lin",
        authorRoleLabel: "Editor",
        highlights: [],
        blocks: [],
        coverAssetId: null,
        sourceUrl: null,
        sourceTitle: null,
        sourceAuthor: null,
        sourcePublishedAt: null,
      },
    });

    const draftArticleId = createArticle.json().id as string;
    const draftDelete = await app.inject({
      method: "DELETE",
      url: `/v1/admin/articles/${draftArticleId}`,
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(draftDelete.statusCode).toBe(200);
    expect(draftDelete.json().id).toBe(draftArticleId);
  });

  it("supports presigned cover uploads", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const fileBody = Buffer.from("fake-presigned-image");
    const presign = await app.inject({
      method: "POST",
      url: "/v1/admin/assets/presign",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        fileName: "cover.png",
        mimeType: "image/png",
        size: fileBody.byteLength,
      },
    });

    expect(presign.statusCode).toBe(200);
    const prepared = presign.json();
    const upload = await app.inject({
      method: "PUT",
      url: new URL(prepared.upload.url).pathname,
      headers: prepared.upload.headers,
      payload: fileBody,
    });

    expect(upload.statusCode).toBe(204);

    const complete = await app.inject({
      method: "POST",
      url: "/v1/admin/assets/complete",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
      payload: {
        token: prepared.upload.token,
      },
    });

    expect(complete.statusCode).toBe(200);
    expect(complete.json().url).toContain("/uploads/");

    const fetchAsset = await app.inject({
      method: "GET",
      url: new URL(prepared.asset.url).pathname,
    });

    expect(fetchAsset.statusCode).toBe(200);
    expect(fetchAsset.body).toBe(fileBody.toString());
  });

  it("reports object-storage status for admins", async () => {
    const app = await createTestApp();
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: {
        email: "admin@xblog.local",
        password: "admin12345",
      },
    });

    const sessionCookie = login.cookies[0];
    const status = await app.inject({
      method: "GET",
      url: "/v1/admin/system/storage",
      cookies: {
        [sessionCookie.name]: sessionCookie.value,
      },
    });

    expect(status.statusCode).toBe(200);
    expect(status.json().driver).toBe("local");
    expect(status.json().diagnostics.ready).toBe(true);
    expect(status.json().diagnostics.samplePublicUrl).toContain("/uploads/");
    expect(status.json().liveCheck.ok).toBe(true);
    expect(status.json().liveCheck.durationMs).toBeGreaterThanOrEqual(0);
  });
});
