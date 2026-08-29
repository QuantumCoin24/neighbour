CREATE TYPE "AdventureScope" AS ENUM ('PERSONAL', 'COMMUNITY');

CREATE TYPE "AdventureCategory" AS ENUM (
  'FAMILY',
  'NATURE',
  'HISTORY',
  'PHOTOGRAPHY',
  'FITNESS',
  'EXPLORATION',
  'FOOD',
  'COMMUNITY',
  'SEASONAL',
  'OTHER'
);

CREATE TYPE "AdventureStageType" AS ENUM (
  'CHECKPOINT',
  'TASK',
  'CLUE',
  'ACTIVITY',
  'PHOTO',
  'INFORMATION'
);

CREATE TABLE "adventures" (
  "id" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "communityId" UUID,
  "trailId" UUID,
  "scope" "AdventureScope" NOT NULL,
  "category" "AdventureCategory" NOT NULL DEFAULT 'OTHER',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "visibility" "LocationVisibility" NOT NULL DEFAULT 'PRIVATE',
  "estimatedMinutes" INTEGER,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "adventures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "adventure_stages" (
  "id" UUID NOT NULL,
  "adventureId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "type" "AdventureStageType" NOT NULL DEFAULT 'CHECKPOINT',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "adventure_stages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "adventures_creatorId_deletedAt_idx"
ON "adventures"("creatorId", "deletedAt");

CREATE INDEX "adventures_communityId_deletedAt_idx"
ON "adventures"("communityId", "deletedAt");

CREATE INDEX "adventures_trailId_idx"
ON "adventures"("trailId");

CREATE INDEX "adventures_scope_visibility_idx"
ON "adventures"("scope", "visibility");

CREATE INDEX "adventures_category_idx"
ON "adventures"("category");

CREATE INDEX "adventures_expiresAt_idx"
ON "adventures"("expiresAt");

CREATE UNIQUE INDEX "adventure_stages_adventureId_position_key"
ON "adventure_stages"("adventureId", "position");

CREATE INDEX "adventure_stages_adventureId_idx"
ON "adventure_stages"("adventureId");

CREATE INDEX "adventure_stages_latitude_longitude_idx"
ON "adventure_stages"("latitude", "longitude");

ALTER TABLE "adventures"
ADD CONSTRAINT "adventures_creatorId_fkey"
FOREIGN KEY ("creatorId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "adventures"
ADD CONSTRAINT "adventures_communityId_fkey"
FOREIGN KEY ("communityId")
REFERENCES "communities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "adventures"
ADD CONSTRAINT "adventures_trailId_fkey"
FOREIGN KEY ("trailId")
REFERENCES "trails"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "adventure_stages"
ADD CONSTRAINT "adventure_stages_adventureId_fkey"
FOREIGN KEY ("adventureId")
REFERENCES "adventures"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
