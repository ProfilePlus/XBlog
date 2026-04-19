-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'GENERIC',
    "tone" TEXT,
    "label" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "coverUrl" TEXT,
    "coverAssetId" TEXT,
    "heroTitle" TEXT NOT NULL,
    "longSummary" TEXT NOT NULL,
    "curatorNote" TEXT NOT NULL,
    "focusAreas" JSONB NOT NULL,
    "featuredArticleId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "readingTime" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "authorRoleLabel" TEXT NOT NULL,
    "highlights" JSONB NOT NULL,
    "contentBlocks" JSONB NOT NULL,
    "publishedAt" DATETIME,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceAuthor" TEXT,
    "sourcePublishedAt" DATETIME,
    "externalId" TEXT,
    "ingestSource" TEXT,
    "ingestScore" REAL,
    "reviewStatus" TEXT,
    "originalLanguage" TEXT,
    "rewriteMode" TEXT,
    "sourceTrail" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "coverUrl" TEXT,
    "coverAssetId" TEXT,
    CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Article_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "Asset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "Category_coverAssetId_key" ON "Category"("coverAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_sourceUrl_key" ON "Article"("sourceUrl");

-- CreateIndex
CREATE INDEX "Article_ingestSource_externalId_idx" ON "Article"("ingestSource", "externalId");

-- CreateIndex
CREATE INDEX "Article_reviewStatus_idx" ON "Article"("reviewStatus");
