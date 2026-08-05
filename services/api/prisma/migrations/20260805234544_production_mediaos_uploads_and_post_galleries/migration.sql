/*
  Warnings:

  - A unique constraint covering the columns `[storageKey]` on the table `media_assets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'UPLOADED', 'READY', 'FAILED', 'DELETED');

-- DropIndex
DROP INDEX "media_assets_ownerId_idx";

-- DropIndex
DROP INDEX "media_assets_storageKey_idx";

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "publicUrl" TEXT,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "uploadedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "post_media" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_media_postId_position_idx" ON "post_media"("postId", "position");

-- CreateIndex
CREATE INDEX "post_media_mediaId_idx" ON "post_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "post_media_postId_mediaId_key" ON "post_media"("postId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "post_media_postId_position_key" ON "post_media"("postId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_ownerId_status_createdAt_idx" ON "media_assets"("ownerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_status_createdAt_idx" ON "media_assets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "media_assets_deletedAt_idx" ON "media_assets"("deletedAt");

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
