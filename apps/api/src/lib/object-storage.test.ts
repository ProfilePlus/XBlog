import { describe, expect, it } from "vitest";
import { buildS3PublicObjectUrl } from "./object-storage";

describe("buildS3PublicObjectUrl", () => {
  it("builds a MinIO path-style public URL", () => {
    expect(
      buildS3PublicObjectUrl({
        provider: "minio",
        bucket: "xblog-assets",
        region: "us-east-1",
        endpoint: "http://127.0.0.1:9000",
        publicBaseUrl: null,
        forcePathStyle: true,
      }, "cover.png"),
    ).toBe("http://127.0.0.1:9000/xblog-assets/cover.png");
  });

  it("builds an AWS S3 public URL without a custom endpoint", () => {
    expect(
      buildS3PublicObjectUrl({
        provider: "aws",
        bucket: "xblog-assets",
        region: "ap-southeast-1",
        endpoint: null,
        publicBaseUrl: null,
        forcePathStyle: false,
      }, "cover.png"),
    ).toBe("https://xblog-assets.s3.ap-southeast-1.amazonaws.com/cover.png");
  });

  it("requires a public base URL for R2", () => {
    expect(() =>
      buildS3PublicObjectUrl({
        provider: "r2",
        bucket: "xblog-assets",
        region: "auto",
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        publicBaseUrl: null,
        forcePathStyle: false,
      }, "cover.png"),
    ).toThrow("OBJECT_STORAGE_PUBLIC_BASE_URL is required");
  });
});
