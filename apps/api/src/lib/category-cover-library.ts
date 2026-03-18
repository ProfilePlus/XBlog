import fs from "node:fs";
import path from "node:path";
import type { CategoryTone } from "@xblog/contracts";

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

function mimeTypeFromFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

const builtInCategoryCoverEntries: Array<{
  fileName: string;
  label: string;
  tone: CategoryTone;
}> = [
  { fileName: "aurora-01-frontier.jpg", label: "Aurora Frontier", tone: "blue" },
  { fileName: "aurora-02-violet-horizon.jpg", label: "Violet Horizon", tone: "pink" },
  { fileName: "aurora-03-blue-ridge.jpg", label: "Blue Ridge", tone: "blue" },
  { fileName: "aurora-04-violet-lake.jpg", label: "Violet Lake", tone: "aurora" },
  { fileName: "aurora-05-green-birch.jpg", label: "Green Birch", tone: "green" },
  { fileName: "aurora-06-snow-trail.jpg", label: "Snow Trail", tone: "green" },
  { fileName: "aurora-07-glacier-dusk.jpg", label: "Glacier Dusk", tone: "blue" },
  { fileName: "aurora-08-emerald-veil.jpg", label: "Emerald Veil", tone: "aurora" },
  { fileName: "aurora-09-rose-horizon.jpg", label: "Rose Horizon", tone: "pink" },
  { fileName: "aurora-10-lapland-drift.jpg", label: "Lapland Drift", tone: "green" },
  { fileName: "aurora-11-midnight-peak.jpg", label: "Midnight Peak", tone: "blue" },
  { fileName: "aurora-12-icefield-lantern.jpg", label: "Icefield Lantern", tone: "green" },
  { fileName: "aurora-13-night-fjord.jpg", label: "Night Fjord", tone: "aurora" },
  { fileName: "aurora-14-violet-summit.jpg", label: "Violet Summit", tone: "pink" },
  { fileName: "aurora-15-polar-silhouette.jpg", label: "Polar Silhouette", tone: "blue" },
  { fileName: "aurora-16-forest-current.jpg", label: "Forest Current", tone: "green" },
  { fileName: "aurora-17-dawn-ridge.jpg", label: "Dawn Ridge", tone: "pink" },
  { fileName: "aurora-18-cobalt-basin.jpg", label: "Cobalt Basin", tone: "blue" },
  { fileName: "aurora-19-polar-canopy.jpg", label: "Polar Canopy", tone: "aurora" },
  { fileName: "aurora-20-alaska-bear-lake.jpg", label: "Alaska Bear Lake", tone: "green" },
];

export function getBuiltInCategoryCoverLibrary() {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const libraryDir = path.join(
    workspaceRoot,
    "apps",
    "web",
    "public",
    "images",
    "category-covers",
    "library",
  );

  return builtInCategoryCoverEntries.map((entry) => {
    const absolutePath = path.join(libraryDir, entry.fileName);

    return {
      ...entry,
      absolutePath,
      mimeType: mimeTypeFromFileName(entry.fileName),
      sourceUrl: `file:///${absolutePath.replace(/\\/g, "/")}`,
    };
  });
}
