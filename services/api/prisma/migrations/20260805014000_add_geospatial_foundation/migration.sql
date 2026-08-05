-- CreateEnum
CREATE TYPE "LocationVisibility" AS ENUM ('PUBLIC', 'COMMUNITY', 'PRIVATE');

-- AlterTable
ALTER TABLE "neighbourhoods"
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6),
ADD COLUMN "locationAccuracyM" INTEGER,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "postcode" TEXT,
ADD COLUMN "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "communities"
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6),
ADD COLUMN "locationAccuracyM" INTEGER,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "postcode" TEXT,
ADD COLUMN "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6),
ADD COLUMN "locationAccuracyM" INTEGER,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "postcode" TEXT,
ADD COLUMN "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "businesses"
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6),
ADD COLUMN "locationAccuracyM" INTEGER,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "postcode" TEXT,
ADD COLUMN "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "neighbourhoods_latitude_longitude_idx"
ON "neighbourhoods"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "neighbourhoods_postcode_idx"
ON "neighbourhoods"("postcode");

-- CreateIndex
CREATE INDEX "neighbourhoods_locationVisibility_idx"
ON "neighbourhoods"("locationVisibility");

-- CreateIndex
CREATE INDEX "communities_latitude_longitude_idx"
ON "communities"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "communities_postcode_idx"
ON "communities"("postcode");

-- CreateIndex
CREATE INDEX "communities_locationVisibility_idx"
ON "communities"("locationVisibility");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx"
ON "events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "events_postcode_idx"
ON "events"("postcode");

-- CreateIndex
CREATE INDEX "events_locationVisibility_idx"
ON "events"("locationVisibility");

-- CreateIndex
CREATE INDEX "businesses_latitude_longitude_idx"
ON "businesses"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "businesses_postcode_idx"
ON "businesses"("postcode");

-- CreateIndex
CREATE INDEX "businesses_locationVisibility_idx"
ON "businesses"("locationVisibility");
