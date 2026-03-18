import type { FastifyInstance } from "fastify";
import type { Asset } from "@xblog/contracts";
import {
  adminCompleteAssetUploadRequestSchema,
  adminImportAssetRequestSchema,
  adminPresignAssetUploadRequestSchema,
  adminPresignAssetUploadResponseSchema,
  assetSchema,
} from "@xblog/contracts";
import { env } from "@/lib/env";
import { getObjectStorage } from "@/lib/object-storage";
import { createUploadToken, readUploadToken, type UploadTokenPayload } from "@/lib/upload-token";
import { requireAdmin } from "@/plugins/auth";

export async function registerUploadRoutes(app: FastifyInstance) {
  const storage = getObjectStorage();

  app.post("/v1/admin/assets/presign", { preHandler: requireAdmin }, async (request, reply) => {
    const payload = adminPresignAssetUploadRequestSchema.parse(request.body);
    if (!payload.mimeType.startsWith("image/")) {
      return reply.code(400).send({ message: "Only image uploads are supported" });
    }

    if (payload.size > env.uploadMaxBytes) {
      return reply.code(400).send({ message: `Image uploads must be <= ${env.uploadMaxBytes} bytes` });
    }

    const asset = storage.createAsset(payload.fileName, payload.mimeType);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString();
    const token = createUploadToken({
      asset,
      expiresAt,
    });
    const upload = await storage.prepareUpload(asset, token);

    return adminPresignAssetUploadResponseSchema.parse({
      asset,
      upload: {
        ...upload,
        completeUrl: `${env.baseUrl}/v1/admin/assets/complete`,
        token,
        expiresAt,
      },
    });
  });

  app.post("/v1/admin/assets/upload", { preHandler: requireAdmin }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ message: "Image file is required" });
    }

    if (!file.mimetype.startsWith("image/")) {
      return reply.code(400).send({ message: "Only image uploads are supported" });
    }

    const asset = await app.store.uploadAsset(await file.toBuffer(), file.filename, file.mimetype);
    return assetSchema.parse(asset);
  });

  app.post("/v1/admin/assets/import", { preHandler: requireAdmin }, async (request) => {
    const payload = adminImportAssetRequestSchema.parse(request.body);
    return assetSchema.parse(await app.store.importRemoteAsset(payload.sourceUrl));
  });

  app.post("/v1/admin/assets/complete", { preHandler: requireAdmin }, async (request, reply) => {
    const payload = adminCompleteAssetUploadRequestSchema.parse(request.body);

    let upload: UploadTokenPayload;
    try {
      upload = readUploadToken(payload.token);
    } catch (error) {
      return reply.code(401).send({
        message: error instanceof Error ? error.message : "Invalid upload token",
      });
    }

    if (!(await storage.completeUpload(upload.asset))) {
      return reply.code(409).send({ message: "Uploaded file not found" });
    }

    return assetSchema.parse(await app.store.saveAsset(upload.asset));
  });

  if (storage.driver === "local") {
    app.put("/uploads/presigned", async (request, reply) => {
      const token = request.headers["x-xblog-upload-token"];
      if (!token || Array.isArray(token)) {
        return reply.code(401).send({ message: "Missing upload token" });
      }

      let upload: UploadTokenPayload;
      try {
        upload = readUploadToken(token);
      } catch (error) {
        return reply.code(401).send({
          message: error instanceof Error ? error.message : "Invalid upload token",
        });
      }

      const contentType = request.headers["content-type"];
      if (Array.isArray(contentType) || !contentType) {
        return reply.code(400).send({ message: "Upload content-type is required" });
      }

      const body = request.body;
      if (!Buffer.isBuffer(body)) {
        return reply.code(400).send({ message: "Upload body is required" });
      }

      if (body.byteLength > env.uploadMaxBytes) {
        return reply.code(400).send({ message: `Image uploads must be <= ${env.uploadMaxBytes} bytes` });
      }

      try {
        await storage.handlePresignedUpload?.(upload.asset, body, contentType);
      } catch (error) {
        return reply.code(400).send({
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }

      return reply.code(204).send();
    });
  }

  app.get("/uploads/:storageKey", async (request, reply) => {
    const asset = await storage.readObject((request.params as { storageKey: string }).storageKey);
    if (!asset) {
      return reply.code(404).send({ message: "Asset not found" });
    }

    reply.type(asset.mimeType);
    return asset.data;
  });
}
