import { env } from "../src/lib/env";
import { getObjectStorageLiveCheck, inspectObjectStorageConfiguration } from "../src/lib/object-storage";

function printSection(title: string) {
  console.log(`\n[xblog-api] ${title}`);
}

function printList(items: string[], emptyMessage: string) {
  if (items.length === 0) {
    console.log(`- ${emptyMessage}`);
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

async function main() {
  const diagnostics = inspectObjectStorageConfiguration();
  const liveCheck = await getObjectStorageLiveCheck();

  printSection("Object Storage Doctor");
  console.log(`- driver: ${env.objectStorageDriver}`);
  console.log(`- provider: ${env.objectStorageDriver === "s3" ? env.objectStorageS3Provider : "local-only"}`);
  console.log(`- bucket: ${env.objectStorageS3Bucket ?? "N/A"}`);
  console.log(`- endpoint: ${env.objectStorageS3Endpoint ?? "N/A"}`);
  console.log(`- publicBaseUrl: ${env.objectStoragePublicBaseUrl ?? "derived / local"}`);
  console.log(`- ready: ${diagnostics.ready}`);
  console.log(`- samplePublicUrl: ${diagnostics.samplePublicUrl ?? "N/A"}`);

  printSection("Missing Env");
  printList(diagnostics.missingEnv, "none");

  printSection("Warnings");
  printList(diagnostics.warnings, "none");

  printSection("Hints");
  printList(diagnostics.hints, "none");

  printSection("Live Check");
  console.log(`- ok: ${liveCheck.ok}`);
  console.log(`- writable: ${liveCheck.writable}`);
  console.log(`- publicReadable: ${liveCheck.publicReadable}`);
  console.log(`- durationMs: ${liveCheck.durationMs}`);
  console.log(`- message: ${liveCheck.message}`);

  if (!diagnostics.ready || !liveCheck.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
