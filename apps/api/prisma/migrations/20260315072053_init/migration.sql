-- CreateEnum
CREATE TYPE "ArticleKind" AS ENUM ('ORIGINAL', 'CURATED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "CategoryTone" AS ENUM ('pink', 'blue', 'green', 'aurora');

-- CreateEnum
CREATE TYPE "HomeIssueStatus" AS ENUM ('CURRENT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HeroSlotType" AS ENUM ('MAIN', 'SIDE_1', 'SIDE_2');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tone" "CategoryTone" NOT NULL,
    "summary" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "longSummary" TEXT NOT NULL,
    "curatorNote" TEXT NOT NULL,
    "focusAreas" JSONB NOT NULL,
    "featuredArticleId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "kind" "ArticleKind" NOT NULL,
    "status" "ArticleStatus" NOT NULL,
    "tone" "CategoryTone" NOT NULL,
    "readingTime" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "authorRoleLabel" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "contentBlocks" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceAuthor" TEXT,
    "sourcePublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "coverAssetId" TEXT,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeIssue" (
    "id" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "note" TEXT,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaHref" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT NOT NULL,
    "secondaryCtaHref" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "status" "HomeIssueStatus" NOT NULL DEFAULT 'CURRENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeIssueHeroSlot" (
    "id" TEXT NOT NULL,
    "homeIssueId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "slot" "HeroSlotType" NOT NULL,

    CONSTRAINT "HomeIssueHeroSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionToken_key" ON "AdminSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_sourceUrl_key" ON "Article"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "HomeIssue_issueNumber_key" ON "HomeIssue"("issueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HomeIssueHeroSlot_homeIssueId_slot_key" ON "HomeIssueHeroSlot"("homeIssueId", "slot");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeIssueHeroSlot" ADD CONSTRAINT "HomeIssueHeroSlot_homeIssueId_fkey" FOREIGN KEY ("homeIssueId") REFERENCES "HomeIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeIssueHeroSlot" ADD CONSTRAINT "HomeIssueHeroSlot_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
