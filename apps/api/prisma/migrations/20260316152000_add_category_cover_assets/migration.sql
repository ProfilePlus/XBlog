CREATE TYPE "AssetKind" AS ENUM ('GENERIC', 'CATEGORY_COVER');

ALTER TABLE "Asset"
ADD COLUMN "kind" "AssetKind" NOT NULL DEFAULT 'GENERIC',
ADD COLUMN "tone" "CategoryTone",
ADD COLUMN "label" TEXT;

ALTER TABLE "Category"
ADD COLUMN "coverAssetId" TEXT;

CREATE UNIQUE INDEX "Category_coverAssetId_key" ON "Category"("coverAssetId");

ALTER TABLE "Category"
ADD CONSTRAINT "Category_coverAssetId_fkey"
FOREIGN KEY ("coverAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
