CREATE TYPE "TrailScope" AS ENUM ('PERSONAL', 'COMMUNITY');

CREATE TYPE "TrailCategory" AS ENUM (
  'WALKING',
  'RUNNING',
  'CYCLING',
  'FAMILY',
  'NATURE',
  'HISTORY',
  'PHOTOGRAPHY',
  'FOOD',
  'DOG_WALKING',
  'ACCESSIBLE',
  'COMMUNITY',
  'OTHER'
);

CREATE TABLE "trails" (
  "id" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "communityId" UUID,
  "scope" "TrailScope" NOT NULL,
  "category" "TrailCategory" NOT NULL DEFAULT 'OTHER',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "visibility" "LocationVisibility" NOT NULL DEFAULT 'PRIVATE',
  "distanceM" INTEGER,
  "estimatedMinutes" INTEGER,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trail_checkpoints" (
  "id" UUID NOT NULL,
  "trailId" UUID NOT NULL,
  "mapDiscoveryId" UUID,
  "position" INTEGER NOT NULL,
  "title" TEXT,
  "instruction" TEXT,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "trail_checkpoints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trails_creatorId_deletedAt_idx"
ON "trails"("creatorId", "deletedAt");

CREATE INDEX "trails_communityId_deletedAt_idx"
ON "trails"("communityId", "deletedAt");

CREATE INDEX "trails_scope_visibility_idx"
ON "trails"("scope", "visibility");

CREATE INDEX "trails_category_idx"
ON "trails"("category");

CREATE INDEX "trails_expiresAt_idx"
ON "trails"("expiresAt");

CREATE UNIQUE INDEX "trail_checkpoints_trailId_position_key"
ON "trail_checkpoints"("trailId", "position");

CREATE INDEX "trail_checkpoints_trailId_idx"
ON "trail_checkpoints"("trailId");

CREATE INDEX "trail_checkpoints_mapDiscoveryId_idx"
ON "trail_checkpoints"("mapDiscoveryId");

CREATE INDEX "trail_checkpoints_latitude_longitude_idx"
ON "trail_checkpoints"("latitude", "longitude");

ALTER TABLE "trails"
ADD CONSTRAINT "trails_creatorId_fkey"
FOREIGN KEY ("creatorId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "trails"
ADD CONSTRAINT "trails_communityId_fkey"
FOREIGN KEY ("communityId")
REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "trail_checkpoints"
ADD CONSTRAINT "trail_checkpoints_trailId_fkey"
FOREIGN KEY ("trailId")
REFERENCES "trails"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "trail_checkpoints"
ADD CONSTRAINT "trail_checkpoints_mapDiscoveryId_fkey"
FOREIGN KEY ("mapDiscoveryId")
REFERENCES "map_discoveries"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
