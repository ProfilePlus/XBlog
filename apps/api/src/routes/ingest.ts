import type { FastifyInstance } from "fastify";
import { ingestArticleRequestSchema } from "@xblog/contracts";
import { requireApiToken } from "@/plugins/auth";

export async function registerIngestRoutes(app: FastifyInstance) {
  app.post("/v1/ingest/articles", { preHandler: requireApiToken }, async (request) => {
    const payload = ingestArticleRequestSchema.parse(request.body);
    return app.store.ingestArticle(payload);
  });
}
