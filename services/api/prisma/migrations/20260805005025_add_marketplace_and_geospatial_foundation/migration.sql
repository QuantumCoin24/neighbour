-- CreateEnum
CREATE TYPE "BusinessVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LocationVisibility" AS ENUM ('PUBLIC', 'COMMUNITY', 'PRIVATE');

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "locationAccuracyM" INTEGER,
ADD COLUMN     "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "postcode" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "locationAccuracyM" INTEGER,
ADD COLUMN     "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "postcode" TEXT;

-- AlterTable
ALTER TABLE "neighbourhoods" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "locationAccuracyM" INTEGER,
ADD COLUMN     "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "postcode" TEXT;

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "communityId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "locationAccuracyM" INTEGER,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "locationVisibility" "LocationVisibility" NOT NULL DEFAULT 'PUBLIC',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_verifications" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" UUID,

    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_events" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_members" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_roles" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_permissions" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_businesses" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organisation_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisation_verifications" (
    "id" UUID NOT NULL,
    "organisationId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "organisation_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "businesses_communityId_idx" ON "businesses"("communityId");

-- CreateIndex
CREATE INDEX "businesses_ownerId_idx" ON "businesses"("ownerId");

-- CreateIndex
CREATE INDEX "businesses_category_idx" ON "businesses"("category");

-- CreateIndex
CREATE INDEX "businesses_latitude_longitude_idx" ON "businesses"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "businesses_postcode_idx" ON "businesses"("postcode");

-- CreateIndex
CREATE INDEX "businesses_locationVisibility_idx" ON "businesses"("locationVisibility");

-- CreateIndex
CREATE UNIQUE INDEX "business_verifications_businessId_key" ON "business_verifications"("businessId");

-- CreateIndex
CREATE INDEX "business_verifications_status_idx" ON "business_verifications"("status");

-- CreateIndex
CREATE INDEX "offers_businessId_idx" ON "offers"("businessId");

-- CreateIndex
CREATE INDEX "offers_active_idx" ON "offers"("active");

-- CreateIndex
CREATE INDEX "business_events_businessId_idx" ON "business_events"("businessId");

-- CreateIndex
CREATE INDEX "business_events_startsAt_idx" ON "business_events"("startsAt");

-- CreateIndex
CREATE INDEX "organisations_ownerId_idx" ON "organisations"("ownerId");

-- CreateIndex
CREATE INDEX "organisations_type_idx" ON "organisations"("type");

-- CreateIndex
CREATE INDEX "organisation_members_organisationId_idx" ON "organisation_members"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_members_userId_idx" ON "organisation_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_members_organisationId_userId_key" ON "organisation_members"("organisationId", "userId");

-- CreateIndex
CREATE INDEX "organisation_roles_organisationId_idx" ON "organisation_roles"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_permissions_roleId_idx" ON "organisation_permissions"("roleId");

-- CreateIndex
CREATE INDEX "organisation_businesses_organisationId_idx" ON "organisation_businesses"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_businesses_businessId_idx" ON "organisation_businesses"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_businesses_organisationId_businessId_key" ON "organisation_businesses"("organisationId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "organisation_verifications_organisationId_key" ON "organisation_verifications"("organisationId");

-- CreateIndex
CREATE INDEX "organisation_verifications_status_idx" ON "organisation_verifications"("status");

-- CreateIndex
CREATE INDEX "communities_latitude_longitude_idx" ON "communities"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "communities_postcode_idx" ON "communities"("postcode");

-- CreateIndex
CREATE INDEX "communities_locationVisibility_idx" ON "communities"("locationVisibility");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx" ON "events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "events_postcode_idx" ON "events"("postcode");

-- CreateIndex
CREATE INDEX "events_locationVisibility_idx" ON "events"("locationVisibility");

-- CreateIndex
CREATE INDEX "neighbourhoods_latitude_longitude_idx" ON "neighbourhoods"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "neighbourhoods_postcode_idx" ON "neighbourhoods"("postcode");

-- CreateIndex
CREATE INDEX "neighbourhoods_locationVisibility_idx" ON "neighbourhoods"("locationVisibility");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_roles" ADD CONSTRAINT "organisation_roles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_permissions" ADD CONSTRAINT "organisation_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organisation_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_businesses" ADD CONSTRAINT "organisation_businesses_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_businesses" ADD CONSTRAINT "organisation_businesses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organisation_verifications" ADD CONSTRAINT "organisation_verifications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
