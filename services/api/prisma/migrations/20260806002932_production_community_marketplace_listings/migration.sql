-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketplaceListingCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MarketplaceListingCategory" AS ENUM ('ELECTRONICS', 'HOME_GARDEN', 'FURNITURE', 'CLOTHING', 'BABY_KIDS', 'SPORTS', 'HOBBIES', 'COLLECTABLES', 'PETS', 'VEHICLE_PARTS', 'PROPERTY', 'JOBS', 'SERVICES', 'TICKETS', 'FREE_ITEMS', 'WANTED', 'OTHER');

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "communityId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "MarketplaceListingCategory" NOT NULL,
    "condition" "MarketplaceListingCondition" NOT NULL,
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "pricePence" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "acceptsOffers" BOOLEAN NOT NULL DEFAULT false,
    "collectionAvailable" BOOLEAN NOT NULL DEFAULT true,
    "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "postageAvailable" BOOLEAN NOT NULL DEFAULT false,
    "localArea" TEXT,
    "postcodeDistrict" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "reservedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listing_media" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_marketplace_listings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_listings_sellerId_status_createdAt_idx" ON "marketplace_listings"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_listings_communityId_status_createdAt_idx" ON "marketplace_listings"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_listings_category_status_createdAt_idx" ON "marketplace_listings"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_listings_status_publishedAt_idx" ON "marketplace_listings"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "marketplace_listings_postcodeDistrict_status_idx" ON "marketplace_listings"("postcodeDistrict", "status");

-- CreateIndex
CREATE INDEX "marketplace_listings_deletedAt_idx" ON "marketplace_listings"("deletedAt");

-- CreateIndex
CREATE INDEX "marketplace_listing_media_listingId_position_idx" ON "marketplace_listing_media"("listingId", "position");

-- CreateIndex
CREATE INDEX "marketplace_listing_media_mediaId_idx" ON "marketplace_listing_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listing_media_listingId_mediaId_key" ON "marketplace_listing_media"("listingId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listing_media_listingId_position_key" ON "marketplace_listing_media"("listingId", "position");

-- CreateIndex
CREATE INDEX "saved_marketplace_listings_userId_createdAt_idx" ON "saved_marketplace_listings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "saved_marketplace_listings_listingId_idx" ON "saved_marketplace_listings"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_marketplace_listings_userId_listingId_key" ON "saved_marketplace_listings"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listing_media" ADD CONSTRAINT "marketplace_listing_media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listing_media" ADD CONSTRAINT "marketplace_listing_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_marketplace_listings" ADD CONSTRAINT "saved_marketplace_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_marketplace_listings" ADD CONSTRAINT "saved_marketplace_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
