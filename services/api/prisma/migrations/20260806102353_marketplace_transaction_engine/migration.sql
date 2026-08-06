-- CreateEnum
CREATE TYPE "MarketplaceOfferStatus" AS ENUM ('PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplaceTransactionStatus" AS ENUM ('RESERVED', 'COLLECTION_PENDING', 'DELIVERY_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "marketplace_offers" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "parentOfferId" UUID,
    "status" "MarketplaceOfferStatus" NOT NULL DEFAULT 'PENDING',
    "amountPence" INTEGER NOT NULL,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_offer_history" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "fromStatus" "MarketplaceOfferStatus",
    "toStatus" "MarketplaceOfferStatus" NOT NULL,
    "amountPence" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_offer_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_transactions" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "acceptedOfferId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "conversationId" UUID,
    "status" "MarketplaceTransactionStatus" NOT NULL DEFAULT 'RESERVED',
    "agreedPricePence" INTEGER NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_offers_listingId_status_createdAt_idx" ON "marketplace_offers"("listingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offers_buyerId_status_createdAt_idx" ON "marketplace_offers"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offers_sellerId_status_createdAt_idx" ON "marketplace_offers"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offers_parentOfferId_idx" ON "marketplace_offers"("parentOfferId");

-- CreateIndex
CREATE INDEX "marketplace_offers_expiresAt_idx" ON "marketplace_offers"("expiresAt");

-- CreateIndex
CREATE INDEX "marketplace_offer_history_offerId_createdAt_idx" ON "marketplace_offer_history"("offerId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offer_history_actorId_createdAt_idx" ON "marketplace_offer_history"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_transactions_listingId_key" ON "marketplace_transactions"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_transactions_acceptedOfferId_key" ON "marketplace_transactions"("acceptedOfferId");

-- CreateIndex
CREATE INDEX "marketplace_transactions_buyerId_status_createdAt_idx" ON "marketplace_transactions"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_transactions_sellerId_status_createdAt_idx" ON "marketplace_transactions"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_transactions_conversationId_idx" ON "marketplace_transactions"("conversationId");

-- CreateIndex
CREATE INDEX "marketplace_transactions_expiresAt_idx" ON "marketplace_transactions"("expiresAt");

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "marketplace_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offer_history" ADD CONSTRAINT "marketplace_offer_history_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "marketplace_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_acceptedOfferId_fkey" FOREIGN KEY ("acceptedOfferId") REFERENCES "marketplace_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_transactions" ADD CONSTRAINT "marketplace_transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
