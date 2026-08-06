-- CreateEnum
CREATE TYPE "MarketplaceFulfilmentMethod" AS ENUM ('COLLECTION', 'DELIVERY', 'POSTAGE');

-- CreateEnum
CREATE TYPE "MarketplaceFulfilmentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'READY', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarketplaceFulfilmentEventType" AS ENUM ('CREATED', 'METHOD_SELECTED', 'COLLECTION_SCHEDULED', 'DELIVERY_SCHEDULED', 'PIN_GENERATED', 'QR_GENERATED', 'READY_FOR_HANDOVER', 'HANDOVER_VERIFIED', 'DISPATCHED', 'DELIVERED', 'BUYER_CONFIRMED', 'SELLER_CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'PROOF_ADDED');

-- CreateEnum
CREATE TYPE "MarketplaceVerificationType" AS ENUM ('PIN', 'QR');

-- CreateEnum
CREATE TYPE "MarketplaceVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MarketplaceProofType" AS ENUM ('COLLECTION_PHOTO', 'DELIVERY_PHOTO', 'RECEIPT', 'SIGNATURE', 'OTHER');

-- CreateTable
CREATE TABLE "marketplace_fulfilments" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "method" "MarketplaceFulfilmentMethod" NOT NULL,
    "status" "MarketplaceFulfilmentStatus" NOT NULL DEFAULT 'PENDING',
    "buyerConfirmedAt" TIMESTAMP(3),
    "sellerConfirmedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_fulfilments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_collections" (
    "id" UUID NOT NULL,
    "fulfilmentId" UUID NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "instructions" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "collectorArrivedAt" TIMESTAMP(3),
    "handoverVerifiedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_deliveries" (
    "id" UUID NOT NULL,
    "fulfilmentId" UUID NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "courier" TEXT,
    "trackingNumber" TEXT,
    "instructions" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_fulfilment_events" (
    "id" UUID NOT NULL,
    "fulfilmentId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "type" "MarketplaceFulfilmentEventType" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_fulfilment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_fulfilment_verifications" (
    "id" UUID NOT NULL,
    "fulfilmentId" UUID NOT NULL,
    "type" "MarketplaceVerificationType" NOT NULL,
    "status" "MarketplaceVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_fulfilment_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_fulfilment_proofs" (
    "id" UUID NOT NULL,
    "fulfilmentId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "type" "MarketplaceProofType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_fulfilment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_fulfilments_transactionId_key" ON "marketplace_fulfilments"("transactionId");

-- CreateIndex
CREATE INDEX "marketplace_fulfilments_status_createdAt_idx" ON "marketplace_fulfilments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilments_method_status_idx" ON "marketplace_fulfilments"("method", "status");

-- CreateIndex
CREATE INDEX "marketplace_fulfilments_expiresAt_idx" ON "marketplace_fulfilments"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_collections_fulfilmentId_key" ON "marketplace_collections"("fulfilmentId");

-- CreateIndex
CREATE INDEX "marketplace_collections_scheduledFor_idx" ON "marketplace_collections"("scheduledFor");

-- CreateIndex
CREATE INDEX "marketplace_collections_postcode_idx" ON "marketplace_collections"("postcode");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_deliveries_fulfilmentId_key" ON "marketplace_deliveries"("fulfilmentId");

-- CreateIndex
CREATE INDEX "marketplace_deliveries_trackingNumber_idx" ON "marketplace_deliveries"("trackingNumber");

-- CreateIndex
CREATE INDEX "marketplace_deliveries_scheduledFor_idx" ON "marketplace_deliveries"("scheduledFor");

-- CreateIndex
CREATE INDEX "marketplace_deliveries_postcode_idx" ON "marketplace_deliveries"("postcode");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_events_fulfilmentId_createdAt_idx" ON "marketplace_fulfilment_events"("fulfilmentId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_events_actorId_createdAt_idx" ON "marketplace_fulfilment_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_events_type_createdAt_idx" ON "marketplace_fulfilment_events"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_fulfilment_verifications_tokenHash_key" ON "marketplace_fulfilment_verifications"("tokenHash");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_verifications_fulfilmentId_type_stat_idx" ON "marketplace_fulfilment_verifications"("fulfilmentId", "type", "status");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_verifications_expiresAt_idx" ON "marketplace_fulfilment_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_proofs_fulfilmentId_createdAt_idx" ON "marketplace_fulfilment_proofs"("fulfilmentId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_proofs_uploadedById_createdAt_idx" ON "marketplace_fulfilment_proofs"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fulfilment_proofs_mediaId_idx" ON "marketplace_fulfilment_proofs"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_fulfilment_proofs_fulfilmentId_mediaId_key" ON "marketplace_fulfilment_proofs"("fulfilmentId", "mediaId");

-- AddForeignKey
ALTER TABLE "marketplace_fulfilments" ADD CONSTRAINT "marketplace_fulfilments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "marketplace_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_collections" ADD CONSTRAINT "marketplace_collections_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_deliveries" ADD CONSTRAINT "marketplace_deliveries_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_events" ADD CONSTRAINT "marketplace_fulfilment_events_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_events" ADD CONSTRAINT "marketplace_fulfilment_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_verifications" ADD CONSTRAINT "marketplace_fulfilment_verifications_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_proofs" ADD CONSTRAINT "marketplace_fulfilment_proofs_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_proofs" ADD CONSTRAINT "marketplace_fulfilment_proofs_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fulfilment_proofs" ADD CONSTRAINT "marketplace_fulfilment_proofs_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
