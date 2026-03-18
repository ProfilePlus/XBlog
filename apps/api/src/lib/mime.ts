import path from "node:path";

const mimeByExt: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export function getMimeTypeFromPath(fileName: string) {
  return mimeByExt[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

export function getExtensionFromMimeType(mimeType: string) {
  const match = Object.entries(mimeByExt).find(([, value]) => value === mimeType);
  return match?.[0] ?? ".bin";
}
