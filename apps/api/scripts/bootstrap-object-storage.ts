import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import type { BucketLocationConstraint, CreateBucketCommandInput } from "@aws-sdk/client-s3";
import { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../src/lib/env";

function createClient() {
  if (env.objectStorageDriver !== "s3") {
    throw new Error("OBJECT_STORAGE_DRIVER must be s3 to bootstrap S3-compatible object storage.");
  }

  if (
    !env.objectStorageS3Bucket ||
    !env.objectStorageS3AccessKeyId ||
    !env.objectStorageS3SecretAccessKey
  ) {
    throw new Error("Missing S3-compatible object storage configuration.");
  }

  if (env.objectStorageS3Provider !== "aws" && !env.objectStorageS3Endpoint) {
    throw new Error("OBJECT_STORAGE_S3_ENDPOINT is required unless OBJECT_STORAGE_S3_PROVIDER=aws.");
  }

  return new S3Client({
    region: env.objectStorageS3Region,
    endpoint: env.objectStorageS3Endpoint ?? undefined,
    forcePathStyle: env.objectStorageS3ForcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.objectStorageS3AccessKeyId,
      secretAccessKey: env.objectStorageS3SecretAccessKey,
    },
  });
}

function buildCreateBucketInput(bucket: string): CreateBucketCommandInput {
  if (env.objectStorageS3Provider === "aws" && env.objectStorageS3Region !== "us-east-1") {
    return {
      Bucket: bucket,
      CreateBucketConfiguration: {
        LocationConstraint: env.objectStorageS3Region as BucketLocationConstraint,
      },
    };
  }

  return {
    Bucket: bucket,
  };
}

async function ensureBucketExists(client: S3Client, bucket: string) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return false;
  } catch {
    await client.send(new CreateBucketCommand(buildCreateBucketInput(bucket)));
    return true;
  }
}

function isLocalMinioEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.port === "9000";
}

async function bootstrapLocalMinio(bucket: string) {
  const endpoint = env.objectStorageS3Endpoint;
  if (!endpoint || !env.objectStorageS3AccessKeyId || !env.objectStorageS3SecretAccessKey) {
    throw new Error("Missing local MinIO bootstrap configuration.");
  }

  const endpointUrl = new URL(endpoint);
  const dockerEndpoint = `${endpointUrl.protocol}//host.docker.internal:${endpointUrl.port}`;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "xblog-minio-"));
  const corsPath = path.join(tempDir, "cors.xml");

  await fs.writeFile(
    corsPath,
    [
      "<CORSConfiguration>",
      "  <CORSRule>",
      `    <AllowedOrigin>${env.adminOrigin}</AllowedOrigin>`,
      `    <AllowedOrigin>${env.webOrigin}</AllowedOrigin>`,
      "    <AllowedMethod>GET</AllowedMethod>",
      "    <AllowedMethod>HEAD</AllowedMethod>",
      "    <AllowedMethod>PUT</AllowedMethod>",
      "    <AllowedHeader>*</AllowedHeader>",
      "    <ExposeHeader>ETag</ExposeHeader>",
      "    <MaxAgeSeconds>3600</MaxAgeSeconds>",
      "  </CORSRule>",
      "</CORSConfiguration>",
      "",
    ].join("\n"),
    "utf8",
  );

  const mcVolumeArgs = ["run", "--rm", "-v", `${tempDir}:/root/.mc`, "-v", `${tempDir}:/work`, "minio/mc"];
  const commands = [
    ["alias", "set", "local", dockerEndpoint, env.objectStorageS3AccessKeyId, env.objectStorageS3SecretAccessKey],
    ["mb", "--ignore-existing", `local/${bucket}`],
    ["anonymous", "set", "public", `local/${bucket}`],
  ];

  let failureOutput = "";
  for (const command of commands) {
    const result = spawnSync("docker", [...mcVolumeArgs, ...command], {
      encoding: "utf8",
      stdio: "pipe",
    });

    if (result.status !== 0) {
      failureOutput = result.stderr || result.stdout || "Failed to bootstrap local MinIO bucket.";
      break;
    }
  }

  await fs.rm(tempDir, { recursive: true, force: true });

  if (failureOutput) {
    throw new Error(failureOutput);
  }

  console.log(
    `[xblog-api] Reused local MinIO bucket "${bucket}" and applied public-read policy. Local MinIO keeps browser CORS enabled by default.`,
  );
}

async function main() {
  const bucket = env.objectStorageS3Bucket;
  if (!bucket) {
    throw new Error("OBJECT_STORAGE_S3_BUCKET is required.");
  }

  if (env.objectStorageS3Endpoint && isLocalMinioEndpoint(env.objectStorageS3Endpoint)) {
    await bootstrapLocalMinio(bucket);
    return;
  }

  const client = createClient();
  const created = await ensureBucketExists(client, bucket);

  try {
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "HEAD", "PUT"],
              AllowedOrigins: [env.adminOrigin, env.webOrigin],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
  } catch (error) {
    throw new Error(
      `Bucket exists, but applying CORS failed. ${
        error instanceof Error ? error.message : "Unknown error."
      }`,
    );
  }

  try {
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "AllowPublicRead",
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      }),
    );
  } catch (error) {
    throw new Error(
      `Bucket exists, but applying public-read policy failed. ${
        error instanceof Error ? error.message : "Unknown error."
      }`,
    );
  }

  console.log(
    `[xblog-api] ${created ? "Created" : "Reused"} ${env.objectStorageS3Provider} object-storage bucket "${bucket}" and applied public-read policy plus browser CORS.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
