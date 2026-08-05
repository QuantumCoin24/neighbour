/*
  Warnings:

  - A unique constraint covering the columns `[handle]` on the table `communities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `handle` to the `communities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommunityCategory" AS ENUM ('LOCAL_AREA', 'STREET', 'ESTATE', 'VILLAGE', 'TOWN', 'CITY', 'SCHOOL', 'PARENTS', 'SPORTS', 'CHARITY', 'BUSINESS_NETWORK', 'HOBBY', 'FAITH', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityJoinPolicy" AS ENUM ('OPEN', 'APPROVAL', 'INVITE_ONLY');

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "accentColour" TEXT,
ADD COLUMN     "allowBusinesses" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowEvents" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowMarketplace" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowMemberPosts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "category" "CommunityCategory" NOT NULL DEFAULT 'LOCAL_AREA',
ADD COLUMN     "discoverable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "handle" TEXT,
ADD COLUMN     "joinPolicy" "CommunityJoinPolicy" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "welcomeMessage" TEXT;

-- CreateIndex

-- Backfill handles for existing communities before enforcing NOT NULL.
UPDATE "communities"
SET "handle" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      COALESCE(NULLIF("slug", ''), 'community-' || LEFT("id"::text, 8)),
      '[^a-zA-Z0-9._-]+',
      '.',
      'g'
    ),
    '^\.+|\.+$',
    '',
    'g'
  )
)
WHERE "handle" IS NULL;

-- Guarantee uniqueness if historical rows contain duplicate slugs.
WITH ranked AS (
  SELECT
    "id",
    "handle",
    ROW_NUMBER() OVER (
      PARTITION BY "handle"
      ORDER BY "createdAt", "id"
    ) AS row_number
  FROM "communities"
)
UPDATE "communities" AS community
SET "handle" =
  LEFT(community."handle", 31)
  || '.'
  || LEFT(community."id"::text, 8)
FROM ranked
WHERE community."id" = ranked."id"
  AND ranked.row_number > 1;

ALTER TABLE "communities"
ALTER COLUMN "handle" SET NOT NULL;

CREATE UNIQUE INDEX "communities_handle_key" ON "communities"("handle");

-- CreateIndex
CREATE INDEX "communities_category_idx" ON "communities"("category");

-- CreateIndex
CREATE INDEX "communities_handle_idx" ON "communities"("handle");

-- CreateIndex
CREATE INDEX "communities_discoverable_idx" ON "communities"("discoverable");

-- CreateIndex
CREATE INDEX "communities_city_postcode_idx" ON "communities"("city", "postcode");
