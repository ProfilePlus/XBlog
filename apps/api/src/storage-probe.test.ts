import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

process.env.XBLOG_STORE_DRIVER = "memory";
process.env.OBJECT_STORAGE_DRIVER = "local";
process.env.API_PORT = "4121";
process.env.API_BASE_URL = "http://127.0.0.1:4121";

let runningApp: FastifyInstance | null = null;

async function createLiveApp() {
  delete (globalThis as typeof globalThis & { xblogObjectStorage?: unknown }).xblogObjectStorage;
  const moduleUrl = `./app.js?probe=${Date.now()}`;
  const { createApp } = await import(moduleUrl);
  const app = await createApp();
  await app.listen({ host: "127.0.0.1", port: 4121 });
  runningApp = app;
  return app;
}

async function login(baseUrl: string) {
  const response = await fetch(`${baseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@xblog.local",
      password: "admin12345",
    }),
  });

  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toBeTruthy();
  return cookie!.split(";")[0];
}

afterEach(async () => {
  if (runningApp) {
    await runningApp.close();
    runningApp = null;
  }

  delete (globalThis as typeof globalThis & { xblogObjectStorage?: unknown }).xblogObjectStorage;
});

describe("storage upload probe", () => {
  it("runs the detailed upload probe for admins", async () => {
    await createLiveApp();
    const baseUrl = "http://127.0.0.1:4121";
    const cookie = await login(baseUrl);

    const response = await fetch(`${baseUrl}/v1/admin/system/storage/probe-upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: "{}",
    });

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.ok).toBe(true);
    expect(payload.summary).toContain("上传探针通过");
    expect(payload.assetUrl).toContain("/uploads/");
    expect(payload.steps.map((step: { key: string }) => step.key)).toEqual([
      "prepare",
      "preflight",
      "upload",
      "complete",
      "public-read",
      "cleanup",
    ]);
    expect(payload.steps.every((step: { ok: boolean }) => step.ok)).toBe(true);
  });
});
