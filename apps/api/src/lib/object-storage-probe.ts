import { setTimeout as sleep } from "node:timers/promises";
import type { AdminObjectStorageUploadProbe } from "@xblog/contracts";
import { env } from "@/lib/env";
import { getObjectStorage, inspectObjectStorageConfiguration } from "@/lib/object-storage";
import { createUploadToken } from "@/lib/upload-token";

function createStep(
  key: AdminObjectStorageUploadProbe["steps"][number]["key"],
  label: string,
  ok: boolean,
  message: string,
  statusCode: number | null = null,
) {
  return {
    key,
    label,
    ok,
    statusCode,
    message,
  };
}

export async function runObjectStorageUploadProbe(): Promise<AdminObjectStorageUploadProbe> {
  const storage = getObjectStorage();
  const diagnostics = inspectObjectStorageConfiguration();
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();
  const payload = Buffer.from("xblog-upload-probe");
  const steps: AdminObjectStorageUploadProbe["steps"] = [];

  if (!diagnostics.ready) {
    steps.push(
      createStep(
        "prepare",
        "准备上传",
        false,
        `缺少配置：${diagnostics.missingEnv.join(", ")}`,
      ),
    );

    return {
      ok: false,
      driver: storage.driver,
      provider: storage.driver === "s3" ? env.objectStorageS3Provider : null,
      checkedAt,
      durationMs: Date.now() - startedAt,
      assetUrl: diagnostics.samplePublicUrl,
      summary: "对象存储配置未完成，无法执行上传探针。",
      steps,
    };
  }

  const asset = storage.createAsset("probe.png", "image/png");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString();
  const token = createUploadToken({
    asset,
    expiresAt,
  });

  let cleanupMessage = "未生成临时对象，无需清理。";
  let ok = false;

  try {
    const upload = await storage.prepareUpload(asset, token);
    steps.push(
      createStep(
        "prepare",
        "准备上传",
        true,
        `已生成 ${upload.method} 上传地址。`,
      ),
    );

    const preflight = await fetch(upload.url, {
      method: "OPTIONS",
      headers: {
        origin: env.adminOrigin,
        "access-control-request-method": upload.method,
        "access-control-request-headers": Object.keys(upload.headers).join(", "),
      },
    });
    const allowOrigin = preflight.headers.get("access-control-allow-origin");
    const preflightOk =
      (preflight.status === 200 || preflight.status === 204) &&
      (allowOrigin === "*" || allowOrigin === env.adminOrigin);
    steps.push(
      createStep(
        "preflight",
        "浏览器预检",
        preflightOk,
        preflightOk
          ? `预检通过，允许来源 ${allowOrigin ?? "unknown"}.`
          : `预检失败，状态 ${preflight.status}，允许来源 ${allowOrigin ?? "missing"}.`,
        preflight.status,
      ),
    );
    if (!preflightOk) {
      throw new Error("Browser preflight failed.");
    }

    const uploadResponse = await fetch(upload.url, {
      method: upload.method,
      headers: upload.headers,
      body: payload,
    });
    const uploadOk = uploadResponse.status === 200 || uploadResponse.status === 204;
    steps.push(
      createStep(
        "upload",
        "上传对象",
        uploadOk,
        uploadOk ? "上传请求成功完成。" : `上传失败，状态 ${uploadResponse.status}.`,
        uploadResponse.status,
      ),
    );
    if (!uploadOk) {
      throw new Error("Object upload failed.");
    }

    const completeOk = await storage.completeUpload(asset);
    steps.push(
      createStep(
        "complete",
        "确认对象",
        completeOk,
        completeOk ? "存储层确认对象已可见。" : "存储层未找到刚上传的对象。",
      ),
    );
    if (!completeOk) {
      throw new Error("Uploaded object not found during completion check.");
    }

    await sleep(250);
    const assetResponse = await fetch(asset.url);
    const assetBody = await assetResponse.text();
    const publicReadable = assetResponse.ok && assetBody === payload.toString();
    steps.push(
      createStep(
        "public-read",
        "公开读取",
        publicReadable,
        publicReadable
          ? "公开读取成功，返回内容与上传内容一致。"
          : `公开读取失败，状态 ${assetResponse.status}.`,
        assetResponse.status,
      ),
    );
    if (!publicReadable) {
      throw new Error("Uploaded object is not publicly readable.");
    }

    ok = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload probe failed.";
    if (!steps.some((step) => step.key === "public-read")) {
      cleanupMessage = `${cleanupMessage} 原因：${message}`;
    }
  } finally {
    try {
      await storage.deleteObject(asset);
      cleanupMessage = "临时探针对象已删除。";
      steps.push(createStep("cleanup", "清理对象", true, cleanupMessage));
    } catch (error) {
      cleanupMessage =
        error instanceof Error ? `清理失败：${error.message}` : "清理失败。";
      steps.push(createStep("cleanup", "清理对象", false, cleanupMessage));
      ok = false;
    }
  }

  return {
    ok,
    driver: storage.driver,
    provider: storage.driver === "s3" ? env.objectStorageS3Provider : null,
    checkedAt,
    durationMs: Date.now() - startedAt,
    assetUrl: asset.url,
    summary: ok ? "上传探针通过：预检、上传、确认、公开读取都正常。" : "上传探针失败，请查看步骤明细。",
    steps,
  };
}
