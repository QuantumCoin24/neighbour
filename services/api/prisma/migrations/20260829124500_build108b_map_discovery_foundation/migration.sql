CREATE TYPE "MapDiscoveryScope" AS ENUM ('PERSONAL', 'COMMUNITY');

CREATE TYPE "MapDiscoveryType" AS ENUM ('MOMENT', 'SEASONAL', 'LANDMARK');

CREATE TYPE "MapDiscoveryCategory" AS ENUM (
  'NATURE',
  'WALK',
  'ACTIVITY',
  'VIEWPOINT',
  'LOCAL_HISTORY',
  'ART_CULTURE',
  'COMMUNITY',
  'OTHER'
);

CREATE TABLE "map_discoveries" (
  "id" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "communityId" UUID,
  "scope" "MapDiscoveryScope" NOT NULL,
  "type" "MapDiscoveryType" NOT NULL,
  "category" "MapDiscoveryCategory" NOT NULL DEFAULT 'OTHER',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "locationAccuracyM" INTEGER,
  "visibility" "LocationVisibility" NOT NULL DEFAULT 'PRIVATE',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "map_discoveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "map_discoveries_scope_community_check"
    CHECK (
      ("scope" = 'PERSONAL' AND "communityId" IS NULL)
      OR
      ("scope" = 'COMMUNITY' AND "communityId" IS NOT NULL)
    )
);

CREATE INDEX "map_discoveries_creatorId_deletedAt_idx"
ON "map_discoveries"("creatorId", "deletedAt");

CREATE INDEX "map_discoveries_communityId_deletedAt_idx"
ON "map_discoveries"("communityId", "deletedAt");

CREATE INDEX "map_discoveries_scope_visibility_idx"
ON "map_discoveries"("scope", "visibility");

CREATE INDEX "map_discoveries_type_idx"
ON "map_discoveries"("type");

CREATE INDEX "map_discoveries_category_idx"
ON "map_discoveries"("category");

CREATE INDEX "map_discoveries_latitude_longitude_idx"
ON "map_discoveries"("latitude", "longitude");

CREATE INDEX "map_discoveries_expiresAt_idx"
ON "map_discoveries"("expiresAt");

ALTER TABLE "map_discoveries"
ADD CONSTRAINT "map_discoveries_creatorId_fkey"
FOREIGN KEY ("creatorId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "map_discoveries"
ADD CONSTRAINT "map_discoveries_communityId_fkey"
FOREIGN KEY ("communityId")
REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
