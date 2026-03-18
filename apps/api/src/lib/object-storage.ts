import fs from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Asset } from "@xblog/contracts";
import { env } from "@/lib/env";
import { getExtensionFromMimeType, getMimeTypeFromPath } from "@/lib/mime";
import { randomId } from "@/lib/security";

export type PreparedUploadRequest = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
};

export type ObjectStorageDiagnostics = {
  ready: boolean;
  missingEnv: string[];
  warnings: string[];
  hints: string[];
  samplePublicUrl: string | null;
  uploadFlowLabel: string;
};

export type ObjectStorageHealthCheck = {
  ok: boolean;
  writable: boolean;
  publicReadable: boolean;
  checkedAt: string;
  durationMs: number;
  message: string;
};

export type S3PublicUrlConfig = {
  provider: "generic" | "aws" | "r2" | "minio";
  bucket: string;
  region: string;
  endpoint: string | null;
  publicBaseUrl: string | null;
  forcePathStyle: boolean;
};

export interface ObjectStorage {
  readonly driver: "local" | "s3";
  createAsset(fileName: string, mimeType?: string, sourceUrl?: string | null): Asset;
  storeBuffer(buffer: Buffer, fileName: string, mimeType?: string, sourceUrl?: string | null): Promise<Asset>;
  importRemoteImage(sourceUrl: string): Promise<Asset>;
  prepareUpload(asset: Asset, token: string): Promise<PreparedUploadRequest>;
  completeUpload(asset: Asset): Promise<boolean>;
  deleteObject(asset: Asset): Promise<void>;
  handlePresignedUpload?(asset: Asset, body: Buffer, contentType: string): Promise<void>;
  readObject(storageKey: string): Promise<{ data: Buffer; mimeType: string } | null>;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildStorageKey(mimeType: string) {
  return `${randomId()}${getExtensionFromMimeType(mimeType)}`;
}

function buildFailedHealthCheck(message: string, durationMs = 0): ObjectStorageHealthCheck {
  return {
    ok: false,
    writable: false,
    publicReadable: false,
    checkedAt: new Date().toISOString(),
    durationMs,
    message,
  };
}

export function buildS3PublicObjectUrl(config: S3PublicUrlConfig, storageKey: string) {
  if (config.publicBaseUrl) {
    return `${normalizeBaseUrl(config.publicBaseUrl)}/${storageKey}`;
  }

  if (config.provider === "r2") {
    throw new Error("OBJECT_STORAGE_PUBLIC_BASE_URL is required when OBJECT_STORAGE_S3_PROVIDER=r2");
  }

  if (config.provider === "aws") {
    if (!config.region || config.region === "auto") {
      throw new Error("OBJECT_STORAGE_S3_REGION must be set to a real AWS region when OBJECT_STORAGE_S3_PROVIDER=aws");
    }

    const baseHost =
      config.region === "us-east-1" ? "s3.amazonaws.com" : `s3.${config.region}.amazonaws.com`;
    return `https://${config.bucket}.${baseHost}/${storageKey}`;
  }

  if (!config.endpoint) {
    throw new Error("OBJECT_STORAGE_S3_ENDPOINT is required for the selected object-storage provider");
  }

  const endpoint = new URL(config.endpoint);
  const basePath = endpoint.pathname.replace(/\/+$/, "");

  if (config.forcePathStyle) {
    return `${endpoint.origin}${basePath}/${config.bucket}/${storageKey}`;
  }

  return `${endpoint.protocol}//${config.bucket}.${endpoint.host}${basePath}/${storageKey}`;
}

export function inspectObjectStorageConfiguration(): ObjectStorageDiagnostics {
  if (env.objectStorageDriver !== "s3") {
    return {
      ready: true,
      missingEnv: [],
      warnings: [],
      hints: [
        "当前是 local driver，上传文件由 API 的 /uploads/* 路径直接公开提供。",
        "如果要切真实对象存储，改为 OBJECT_STORAGE_DRIVER=s3 并补齐对应 provider 配置。",
      ],
      samplePublicUrl: `${normalizeBaseUrl(env.baseUrl)}/uploads/diagnostics/example.png`,
      uploadFlowLabel: "Admin presign -> API /uploads/presigned -> complete",
    };
  }

  const missingEnv: string[] = [];
  const warnings: string[] = [];
  const hints: string[] = [];

  if (!env.objectStorageS3Bucket) {
    missingEnv.push("OBJECT_STORAGE_S3_BUCKET");
  }

  if (!env.objectStorageS3AccessKeyId) {
    missingEnv.push("OBJECT_STORAGE_S3_ACCESS_KEY_ID");
  }

  if (!env.objectStorageS3SecretAccessKey) {
    missingEnv.push("OBJECT_STORAGE_S3_SECRET_ACCESS_KEY");
  }

  if (env.objectStorageS3Provider !== "aws" && !env.objectStorageS3Endpoint) {
    missingEnv.push("OBJECT_STORAGE_S3_ENDPOINT");
  }

  if (env.objectStorageS3Provider === "aws" && env.objectStorageS3Region === "auto") {
    missingEnv.push("OBJECT_STORAGE_S3_REGION");
  }

  if (env.objectStorageS3Provider === "r2" && !env.objectStoragePublicBaseUrl) {
    missingEnv.push("OBJECT_STORAGE_PUBLIC_BASE_URL");
  }

  if (env.objectStorageS3Provider === "aws" && env.objectStorageS3Endpoint) {
    warnings.push("AWS provider 通常不需要 OBJECT_STORAGE_S3_ENDPOINT，除非你在走代理或网关。");
  }

  if (
    env.objectStorageS3Provider !== "r2" &&
    !env.objectStoragePublicBaseUrl
  ) {
    warnings.push("当前公开 URL 会按 bucket/endpoint 规则自动推导；如果后面要挂 CDN 或自定义域名，建议补 OBJECT_STORAGE_PUBLIC_BASE_URL。");
  }

  if (env.objectStorageS3Provider === "minio" && !env.objectStorageS3ForcePathStyle) {
    warnings.push("本地 MinIO 一般建议开启 OBJECT_STORAGE_S3_FORCE_PATH_STYLE=true。");
  }

  if (env.objectStorageS3Provider === "minio") {
    hints.push("本地 MinIO 联调前先运行 pnpm dev:storage，确保 bucket 已存在且允许公开读取。");
  }

  if (env.objectStorageS3Provider === "aws") {
    hints.push("AWS S3 可以省略 endpoint；公开访问会按 bucket + region 自动推导。");
  }

  if (env.objectStorageS3Provider === "r2") {
    hints.push("Cloudflare R2 必须配置 OBJECT_STORAGE_PUBLIC_BASE_URL，值应指向 r2.dev 或你的自定义公开域名。");
  }

  if (env.objectStorageS3Provider === "generic") {
    hints.push("通用 S3 兼容服务建议同时配置 endpoint 和 public base URL，这样切 CDN 或网关时更稳。");
  }

  let samplePublicUrl: string | null = null;
  if (missingEnv.length === 0) {
    try {
      samplePublicUrl = buildS3PublicObjectUrl(
        {
          provider: env.objectStorageS3Provider,
          bucket: env.objectStorageS3Bucket!,
          region: env.objectStorageS3Region,
          endpoint: env.objectStorageS3Endpoint,
          publicBaseUrl: env.objectStoragePublicBaseUrl,
          forcePathStyle: env.objectStorageS3ForcePathStyle,
        },
        "diagnostics/example.png",
      );
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "公开 URL 推导失败。");
    }
  }

  return {
    ready: missingEnv.length === 0,
    missingEnv,
    warnings,
    hints,
    samplePublicUrl,
    uploadFlowLabel: "Admin presign -> browser PUT to provider -> complete",
  };
}

class LocalObjectStorage implements ObjectStorage {
  readonly driver = "local" as const;

  createAsset(fileName: string, mimeType?: string, sourceUrl: string | null = null): Asset {
    const resolvedMimeType = mimeType ?? getMimeTypeFromPath(fileName);
    const storageKey = buildStorageKey(resolvedMimeType);

    return {
      id: randomId(),
      storageKey,
      url: `${normalizeBaseUrl(env.baseUrl)}/uploads/${storageKey}`,
      mimeType: resolvedMimeType,
      kind: "GENERIC",
      tone: null,
      label: null,
      width: null,
      height: null,
      sourceUrl,
      createdAt: new Date().toISOString(),
    };
  }

  private async ensureReady() {
    await fs.mkdir(path.resolve(process.cwd(), env.assetsDir), { recursive: true });
  }

  private resolveFilePath(storageKey: string) {
    return path.resolve(process.cwd(), env.assetsDir, storageKey);
  }

  async writeBuffer(storageKey: string, buffer: Buffer) {
    await this.ensureReady();
    await fs.writeFile(this.resolveFilePath(storageKey), buffer);
  }

  async hasObject(storageKey: string) {
    try {
      await fs.access(this.resolveFilePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  async storeBuffer(buffer: Buffer, fileName: string, mimeType?: string, sourceUrl: string | null = null) {
    const asset = this.createAsset(fileName, mimeType, sourceUrl);
    await this.writeBuffer(asset.storageKey, buffer);
    return asset;
  }

  async importRemoteImage(sourceUrl: string) {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileName = new URL(sourceUrl).pathname.split("/").pop() || "remote-image";
    const mimeType = response.headers.get("content-type") ?? undefined;

    return this.storeBuffer(Buffer.from(arrayBuffer), fileName, mimeType, sourceUrl);
  }

  async prepareUpload(asset: Asset, token: string) {
    return {
      url: `${normalizeBaseUrl(env.baseUrl)}/uploads/presigned`,
      method: "PUT" as const,
      headers: {
        "content-type": asset.mimeType,
        "x-xblog-upload-token": token,
      },
    };
  }

  async completeUpload(asset: Asset) {
    return this.hasObject(asset.storageKey);
  }

  async deleteObject(asset: Asset) {
    try {
      await fs.unlink(this.resolveFilePath(asset.storageKey));
    } catch {
      // Ignore missing files during health checks or retries.
    }
  }

  async handlePresignedUpload(asset: Asset, body: Buffer, contentType: string) {
    if (contentType !== asset.mimeType) {
      throw new Error("Upload content-type does not match the presigned asset");
    }

    await this.writeBuffer(asset.storageKey, body);
  }

  async readObject(storageKey: string) {
    try {
      return {
        data: await fs.readFile(this.resolveFilePath(storageKey)),
        mimeType: getMimeTypeFromPath(storageKey),
      };
    } catch {
      return null;
    }
  }
}

class S3CompatibleObjectStorage implements ObjectStorage {
  readonly driver = "s3" as const;

  constructor(
    private readonly client: S3Client,
    private readonly config: S3PublicUrlConfig,
  ) {}

  private publicUrl(storageKey: string) {
    return buildS3PublicObjectUrl(this.config, storageKey);
  }

  createAsset(fileName: string, mimeType?: string, sourceUrl: string | null = null): Asset {
    const resolvedMimeType = mimeType ?? getMimeTypeFromPath(fileName);
    const storageKey = buildStorageKey(resolvedMimeType);

    return {
      id: randomId(),
      storageKey,
      url: this.publicUrl(storageKey),
      mimeType: resolvedMimeType,
      kind: "GENERIC",
      tone: null,
      label: null,
      width: null,
      height: null,
      sourceUrl,
      createdAt: new Date().toISOString(),
    };
  }

  private async putObject(asset: Asset, body: Buffer) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: asset.storageKey,
        Body: body,
        ContentType: asset.mimeType,
      }),
    );
  }

  async storeBuffer(buffer: Buffer, fileName: string, mimeType?: string, sourceUrl: string | null = null) {
    const asset = this.createAsset(fileName, mimeType, sourceUrl);
    await this.putObject(asset, buffer);
    return asset;
  }

  async importRemoteImage(sourceUrl: string) {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileName = new URL(sourceUrl).pathname.split("/").pop() || "remote-image";
    const mimeType = response.headers.get("content-type") ?? undefined;

    return this.storeBuffer(Buffer.from(arrayBuffer), fileName, mimeType, sourceUrl);
  }

  async prepareUpload(asset: Asset, _token: string) {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: asset.storageKey,
        ContentType: asset.mimeType,
      }),
      { expiresIn: 60 * 15 },
    );

    return {
      url,
      method: "PUT",
      headers: {
        "content-type": asset.mimeType,
      },
    } satisfies PreparedUploadRequest;
  }

  async completeUpload(asset: Asset) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: asset.storageKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(asset: Asset) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: asset.storageKey,
      }),
    );
  }

  async readObject(_storageKey: string) {
    return null;
  }
}

export async function runObjectStorageHealthCheck(
  storage: ObjectStorage = getObjectStorage(),
): Promise<ObjectStorageHealthCheck> {
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();
  const payload = Buffer.from("xblog-storage-health");
  let asset: Asset | null = null;

  try {
    asset = await storage.storeBuffer(payload, "health-check.txt", "text/plain");
    let publicReadable = false;
    let message = "Storage write/read check passed.";

    if (storage.driver === "local") {
      const object = await storage.readObject(asset.storageKey);
      publicReadable = Boolean(object && object.data.toString() === payload.toString());
      if (!publicReadable) {
        message = "Storage write passed, but local read-back failed.";
      }
    } else {
      const response = await fetch(asset.url);
      const body = await response.text();
      publicReadable = response.ok && body === payload.toString();
      if (!publicReadable) {
        message = `Storage write passed, but public read failed with ${response.status}.`;
      }
    }

    await storage.deleteObject(asset);

    return {
      ok: publicReadable,
      writable: true,
      publicReadable,
      checkedAt,
      durationMs: Date.now() - startedAt,
      message,
    };
  } catch (error) {
    if (asset) {
      await storage.deleteObject(asset).catch(() => undefined);
    }

    return buildFailedHealthCheck(
      error instanceof Error ? error.message : "Object storage health check failed.",
      Date.now() - startedAt,
    );
  }
}

export async function getObjectStorageLiveCheck(): Promise<ObjectStorageHealthCheck> {
  const diagnostics = inspectObjectStorageConfiguration();
  if (!diagnostics.ready) {
    return buildFailedHealthCheck(
      `Storage configuration incomplete: ${diagnostics.missingEnv.join(", ")}`,
    );
  }

  try {
    return await runObjectStorageHealthCheck(getObjectStorage());
  } catch (error) {
    return buildFailedHealthCheck(
      error instanceof Error
        ? `Storage initialization failed: ${error.message}`
        : "Storage initialization failed.",
    );
  }
}

const globalForObjectStorage = globalThis as typeof globalThis & {
  xblogObjectStorage?: ObjectStorage;
};

function createS3CompatibleObjectStorage() {
  if (!env.objectStorageS3Bucket || !env.objectStorageS3AccessKeyId || !env.objectStorageS3SecretAccessKey) {
    throw new Error("OBJECT_STORAGE_S3_BUCKET, OBJECT_STORAGE_S3_ACCESS_KEY_ID, and OBJECT_STORAGE_S3_SECRET_ACCESS_KEY are required when OBJECT_STORAGE_DRIVER=s3");
  }

  if (env.objectStorageS3Provider !== "aws" && !env.objectStorageS3Endpoint) {
    throw new Error("OBJECT_STORAGE_S3_ENDPOINT is required unless OBJECT_STORAGE_S3_PROVIDER=aws");
  }

  if (env.objectStorageS3Provider === "r2" && !env.objectStoragePublicBaseUrl) {
    throw new Error("OBJECT_STORAGE_PUBLIC_BASE_URL is required when OBJECT_STORAGE_S3_PROVIDER=r2");
  }

  const config = {
    provider: env.objectStorageS3Provider,
    bucket: env.objectStorageS3Bucket,
    region: env.objectStorageS3Region,
    endpoint: env.objectStorageS3Endpoint,
    publicBaseUrl: env.objectStoragePublicBaseUrl,
    forcePathStyle: env.objectStorageS3ForcePathStyle,
  } satisfies S3PublicUrlConfig;

  return new S3CompatibleObjectStorage(
    new S3Client({
      region: env.objectStorageS3Region,
      endpoint: env.objectStorageS3Endpoint ?? undefined,
      forcePathStyle: env.objectStorageS3ForcePathStyle,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: env.objectStorageS3AccessKeyId,
        secretAccessKey: env.objectStorageS3SecretAccessKey,
      },
    }),
    config,
  );
}

export function getObjectStorage(): ObjectStorage {
  if (!globalForObjectStorage.xblogObjectStorage) {
    globalForObjectStorage.xblogObjectStorage =
      env.objectStorageDriver === "s3" ? createS3CompatibleObjectStorage() : new LocalObjectStorage();
  }

  return globalForObjectStorage.xblogObjectStorage!;
}
