-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Article"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "ingestSource" TEXT,
ADD COLUMN "ingestScore" DOUBLE PRECISION,
ADD COLUMN "reviewStatus" "ReviewStatus",
ADD COLUMN "originalLanguage" TEXT,
ADD COLUMN "rewriteMode" TEXT,
ADD COLUMN "sourceTrail" JSONB;

-- CreateIndex
CREATE INDEX "Article_ingestSource_externalId_idx" ON "Article"("ingestSource", "externalId");

-- CreateIndex
CREATE INDEX "Article_reviewStatus_idx" ON "Article"("reviewStatus");
