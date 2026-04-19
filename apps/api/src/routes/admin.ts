import type { FastifyInstance } from "fastify";
import {
  adminObjectStorageStatusSchema,
  adminArticleListResponseSchema,
  adminObjectStorageUploadProbeSchema,
  createTokenRequestSchema,
  upsertArticleRequestSchema,
  upsertCategoryRequestSchema,
} from "@xblog/contracts";
import { env } from "@/lib/env";
import { runObjectStorageUploadProbe } from "@/lib/object-storage-probe";
import { getObjectStorageLiveCheck, inspectObjectStorageConfiguration } from "@/lib/object-storage";
import { requireAdmin } from "@/plugins/auth";

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/v1/admin/articles", { preHandler: requireAdmin }, async () => app.store.listArticles());

  app.get("/v1/admin/article-library", { preHandler: requireAdmin }, async (request) => {
    const query = request.query as {
      page?: string;
      pageSize?: string;
    };
    const page = Math.max(1, Number(query.page ?? "1") || 1);
    const pageSize = Math.min(60, Math.max(1, Number(query.pageSize ?? "12") || 12));
    const articles = await app.store.listArticles();
    const totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const start = (normalizedPage - 1) * pageSize;

    return adminArticleListResponseSchema.parse({
      total: articles.length,
      page: normalizedPage,
      pageSize,
      items: articles.slice(start, start + pageSize),
    });
  });

  app.get("/v1/admin/articles/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const article = await app.store.getArticleById((request.params as { id: string }).id);
    if (!article) {
      return reply.code(404).send({ message: "Article not found" });
    }
    return article;
  });

  app.post("/v1/admin/articles", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = upsertArticleRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues.map((issue) => issue.message).join("；"),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const payload = parsed.data;
    return app.store.upsertArticle(payload);
  });

  app.put("/v1/admin/articles/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = upsertArticleRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues.map((issue) => issue.message).join("；"),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const payload = parsed.data;
    return app.store.upsertArticle({
      ...payload,
      id: (request.params as { id: string }).id,
    });
  });

  app.delete("/v1/admin/articles/:id", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const article = await app.store.deleteArticle((request.params as { id: string }).id);
      if (!article) {
        return reply.code(404).send({ message: "Article not found" });
      }
      return article;
    } catch (error) {
      if (error instanceof Error && error.message === "Article is used in home issue") {
        return reply.code(409).send({ message: "该文章仍在使用中，先调整后再删除。" });
      }

      throw error;
    }
  });

  app.post("/v1/admin/articles/:id/publish", { preHandler: requireAdmin }, async (request, reply) => {
    const article = await app.store.publishArticle((request.params as { id: string }).id);
    if (!article) {
      return reply.code(404).send({ message: "Article not found" });
    }
    return article;
  });

  app.post("/v1/admin/articles/:id/hide", { preHandler: requireAdmin }, async (request, reply) => {
    const article = await app.store.hideArticle((request.params as { id: string }).id);
    if (!article) {
      return reply.code(404).send({ message: "Article not found" });
    }
    return article;
  });

  app.get("/v1/admin/categories", { preHandler: requireAdmin }, async () => app.store.listCategories());

  app.post("/v1/admin/categories", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = upsertCategoryRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues.map((issue) => issue.message).join("；"),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    try {
      return await app.store.upsertCategory(parsed.data);
    } catch (error) {
      if (error instanceof Error && error.message === "Asset not found") {
        return reply.code(404).send({ message: "分类封面素材不存在。" });
      }
      if (error instanceof Error && error.message === "Category cover asset is already assigned") {
        return reply.code(409).send({ message: "这个素材已经被其他分类占用。" });
      }

      throw error;
    }
  });

  app.put("/v1/admin/categories/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = upsertCategoryRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: parsed.error.issues.map((issue) => issue.message).join("；"),
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    try {
      return await app.store.upsertCategory({
        id: (request.params as { id: string }).id,
        ...parsed.data,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Category not found") {
        return reply.code(404).send({ message: "Category not found" });
      }
      if (error instanceof Error && error.message === "Asset not found") {
        return reply.code(404).send({ message: "分类封面素材不存在。" });
      }
      if (error instanceof Error && error.message === "Category cover asset is already assigned") {
        return reply.code(409).send({ message: "这个素材已经被其他分类占用。" });
      }

      throw error;
    }
  });

  app.delete("/v1/admin/categories/:id", { preHandler: requireAdmin }, async (request, reply) => {
    try {
      const category = await app.store.deleteCategory((request.params as { id: string }).id);
      if (!category) {
        return reply.code(404).send({ message: "Category not found" });
      }
      return category;
    } catch (error) {
      if (error instanceof Error && error.message === "Category is not empty") {
        return reply.code(409).send({ message: "分类下还有文章，不能直接删除。请先移动或删除这些文章。" });
      }

      throw error;
    }
  });

  app.get("/v1/admin/tokens", { preHandler: requireAdmin }, async () => app.store.listTokens());

  app.post("/v1/admin/tokens", { preHandler: requireAdmin }, async (request) => {
    const payload = createTokenRequestSchema.parse(request.body);
    const { token, plainTextToken } = await app.store.createToken(payload.label, payload.scopes);
    return {
      token,
      plainTextToken,
    };
  });

  app.post("/v1/admin/tokens/:id/revoke", { preHandler: requireAdmin }, async (request, reply) => {
    const token = await app.store.revokeToken((request.params as { id: string }).id);
    if (!token) {
      return reply.code(404).send({ message: "Token not found" });
    }
    return token;
  });

  app.delete("/v1/admin/tokens/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const token = await app.store.deleteToken((request.params as { id: string }).id);
    if (!token) {
      return reply.code(404).send({ message: "Token not found" });
    }
    return token;
  });

  app.get("/v1/admin/system/storage", { preHandler: requireAdmin }, async () => {
    const diagnostics = inspectObjectStorageConfiguration();
    const liveCheck = await getObjectStorageLiveCheck();

    return adminObjectStorageStatusSchema.parse({
      driver: env.objectStorageDriver === "s3" ? "s3" : "local",
      provider: env.objectStorageDriver === "s3" ? env.objectStorageS3Provider : null,
      bucket: env.objectStorageDriver === "s3" ? env.objectStorageS3Bucket : null,
      endpoint: env.objectStorageDriver === "s3" ? env.objectStorageS3Endpoint : null,
      publicBaseUrl: env.objectStorageDriver === "s3" ? env.objectStoragePublicBaseUrl : null,
      forcePathStyle: env.objectStorageDriver === "s3" ? env.objectStorageS3ForcePathStyle : null,
      maxUploadBytes: env.uploadMaxBytes,
      diagnostics,
      liveCheck,
    });
  });

  app.post("/v1/admin/system/storage/probe-upload", { preHandler: requireAdmin }, async () => {
    return adminObjectStorageUploadProbeSchema.parse(await runObjectStorageUploadProbe());
  });
}
