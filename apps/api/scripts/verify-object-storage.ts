import assert from "node:assert/strict";
import type { AdminObjectStorageUploadProbe } from "@xblog/contracts";

function getCookieHeader(response: Response) {
  const header = response.headers.get("set-cookie");
  if (!header) {
    throw new Error("Missing admin session cookie.");
  }

  return header.split(";")[0];
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function main() {
  const port = Number(process.env.VERIFY_API_PORT ?? 4120);
  process.env.API_PORT = String(port);
  process.env.API_BASE_URL = `http://127.0.0.1:${port}`;
  process.env.XBLOG_STORE_DRIVER = "memory";

  const { createApp } = await import("../src/app.js");
  const app = await createApp();
  await app.listen({ host: "127.0.0.1", port });

  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const login = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@xblog.local",
        password: "admin12345",
      }),
    });
    assert.equal(login.status, 200, "Admin login must succeed before upload verification.");
    const cookie = getCookieHeader(login);

    const probe = await requestJson<AdminObjectStorageUploadProbe>(`${baseUrl}/v1/admin/system/storage/probe-upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: "{}",
    });

    assert.equal(
      probe.ok,
      true,
      `Object-storage probe must pass. Summary: ${probe.summary}. Steps: ${probe.steps
        .map((step) => `${step.key}:${step.ok ? "ok" : "fail"}(${step.message})`)
        .join(" | ")}`,
    );

    console.log(`[xblog-api] Verified object-storage upload probe via ${probe.assetUrl}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
