-- DropForeignKey
ALTER TABLE "HomeIssueHeroSlot" DROP CONSTRAINT "HomeIssueHeroSlot_articleId_fkey";
ALTER TABLE "HomeIssueHeroSlot" DROP CONSTRAINT "HomeIssueHeroSlot_homeIssueId_fkey";

-- DropTable
DROP TABLE "HomeIssueHeroSlot";
DROP TABLE "HomeIssue";

-- DropEnum
DROP TYPE "HomeIssueStatus";
DROP TYPE "HeroSlotType";
