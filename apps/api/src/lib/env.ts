import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function findWorkspaceRoot(startDir: string) {
  let currentDir = startDir;

  while (true) {
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }

    currentDir = parentDir;
  }
}

function loadLocalEnvFiles() {
  const currentDir = process.cwd();
  const workspaceRoot = findWorkspaceRoot(currentDir);
  const candidatePaths = [
    path.join(currentDir, ".env.local"),
    path.join(currentDir, ".env"),
    path.join(workspaceRoot, ".env.local"),
    path.join(workspaceRoot, ".env"),
  ];
  const seen = new Set<string>();

  for (const filePath of candidatePaths) {
    const resolvedPath = path.resolve(filePath);
    if (seen.has(resolvedPath) || !fs.existsSync(resolvedPath)) {
      continue;
    }

    seen.add(resolvedPath);
    process.loadEnvFile(resolvedPath);
  }
}

loadLocalEnvFiles();

const objectStorageS3Providers = ["generic", "aws", "r2", "minio"] as const;
type ObjectStorageS3Provider = (typeof objectStorageS3Providers)[number];

const objectStorageS3Provider = (process.env.OBJECT_STORAGE_S3_PROVIDER ?? "generic") as string;
if (!objectStorageS3Providers.includes(objectStorageS3Provider as ObjectStorageS3Provider)) {
  throw new Error(
    "OBJECT_STORAGE_S3_PROVIDER must be one of: generic, aws, r2, minio.",
  );
}

export const env = {
  apiHost: process.env.API_HOST ?? "127.0.0.1",
  apiPort: Number(process.env.API_PORT ?? 4000),
  adminOrigin: process.env.ADMIN_ORIGIN ?? "http://127.0.0.1:3001",
  webOrigin: process.env.WEB_ORIGIN ?? "http://127.0.0.1:3000",
  storeDriver: process.env.XBLOG_STORE_DRIVER ?? "auto",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "xblog_admin_session",
  dataDir: process.env.DATA_DIR ?? ".data",
  assetsDir: process.env.ASSETS_DIR ?? ".data/assets",
  baseUrl: process.env.API_BASE_URL ?? "http://127.0.0.1:4000",
  uploadSigningSecret: process.env.UPLOAD_SIGNING_SECRET ?? "xblog-local-upload-secret",
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 8 * 1024 * 1024),
  objectStorageDriver: process.env.OBJECT_STORAGE_DRIVER ?? "local",
  objectStorageS3Provider: objectStorageS3Provider as ObjectStorageS3Provider,
  objectStoragePublicBaseUrl: process.env.OBJECT_STORAGE_PUBLIC_BASE_URL ?? null,
  objectStorageS3Region: process.env.OBJECT_STORAGE_S3_REGION ?? "auto",
  objectStorageS3Endpoint: process.env.OBJECT_STORAGE_S3_ENDPOINT ?? null,
  objectStorageS3Bucket: process.env.OBJECT_STORAGE_S3_BUCKET ?? null,
  objectStorageS3AccessKeyId: process.env.OBJECT_STORAGE_S3_ACCESS_KEY_ID ?? null,
  objectStorageS3SecretAccessKey: process.env.OBJECT_STORAGE_S3_SECRET_ACCESS_KEY ?? null,
  objectStorageS3ForcePathStyle: process.env.OBJECT_STORAGE_S3_FORCE_PATH_STYLE === "true",
};
