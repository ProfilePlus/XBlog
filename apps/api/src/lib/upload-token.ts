import type { Asset } from "@xblog/contracts";
import { assetSchema } from "@xblog/contracts";
import { env } from "@/lib/env";
import { safeEqual, signValue } from "@/lib/security";

export type UploadTokenPayload = {
  asset: Asset;
  expiresAt: string;
};

export function createUploadToken(payload: UploadTokenPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(body, env.uploadSigningSecret);
  return `${body}.${signature}`;
}

export function readUploadToken(token: string) {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    throw new Error("Invalid upload token");
  }

  const expectedSignature = signValue(body, env.uploadSigningSecret);
  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("Invalid upload token signature");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as UploadTokenPayload;
  if (Date.parse(payload.expiresAt) < Date.now()) {
    throw new Error("Upload token expired");
  }

  return {
    asset: assetSchema.parse(payload.asset),
    expiresAt: payload.expiresAt,
  };
}
