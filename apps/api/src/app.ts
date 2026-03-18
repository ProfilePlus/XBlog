import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { env } from "@/lib/env";
import { createStore } from "@/repositories/create-store";
import { registerAdminRoutes } from "@/routes/admin";
import { registerAuthRoutes } from "@/routes/auth";
import { registerHealthRoutes } from "@/routes/health";
import { registerIngestRoutes } from "@/routes/ingest";
import { registerPublicRoutes } from "@/routes/public";
import { registerUploadRoutes } from "@/routes/uploads";

export async function createApp() {
  const app = Fastify({
    logger: false,
  });

  app.store = await createStore();

  await app.register(cookie);
  await app.register(cors, {
    origin: [env.adminOrigin, env.webOrigin],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: env.uploadMaxBytes,
    },
  });
  app.addContentTypeParser(/^image\/.*/, { parseAs: "buffer" }, (_request, body, done) => {
    done(null, body);
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerPublicRoutes(app);
  await registerAdminRoutes(app);
  await registerIngestRoutes(app);
  await registerUploadRoutes(app);

  return app;
}
