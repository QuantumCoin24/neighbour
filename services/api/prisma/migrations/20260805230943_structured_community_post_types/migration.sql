-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('STANDARD', 'ANNOUNCEMENT', 'QUESTION', 'RECOMMENDATION', 'HELP_REQUEST', 'LOST_FOUND', 'SAFETY_ALERT', 'ROAD_CLOSURE', 'LOCAL_UPDATE', 'POLL', 'EVENT_SHARE', 'MARKETPLACE_SHARE', 'BUSINESS_UPDATE', 'VOLUNTEER_REQUEST');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX "posts_communityId_type_status_publishedAt_idx" ON "posts"("communityId", "type", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "posts_communityId_isPinned_publishedAt_idx" ON "posts"("communityId", "isPinned", "publishedAt");
