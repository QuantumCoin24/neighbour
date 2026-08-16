CREATE TYPE "MarketplaceSettlementStatus" AS ENUM (
  'PENDING',
  'AVAILABLE',
  'PAID_OUT',
  'REVERSED'
);

CREATE TABLE "marketplace_settlements" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "status" "MarketplaceSettlementStatus" NOT NULL DEFAULT 'PENDING',

    "grossAmountPence" INTEGER NOT NULL,
    "platformFeePence" INTEGER NOT NULL,
    "processorFeePence" INTEGER NOT NULL,
    "sellerProceedsPence" INTEGER NOT NULL,
    "refundedAmountPence" INTEGER NOT NULL DEFAULT 0,

    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "provider" "MarketplacePaymentProvider" NOT NULL,
    "providerReference" TEXT,

    "capturedAt" TIMESTAMP(3) NOT NULL,
    "availableAt" TIMESTAMP(3),
    "paidOutAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketplace_settlements_paymentId_key"
ON "marketplace_settlements"("paymentId");

CREATE INDEX "marketplace_settlements_sellerId_status_createdAt_idx"
ON "marketplace_settlements"("sellerId", "status", "createdAt");

CREATE INDEX "marketplace_settlements_transactionId_idx"
ON "marketplace_settlements"("transactionId");

CREATE INDEX "marketplace_settlements_status_createdAt_idx"
ON "marketplace_settlements"("status", "createdAt");

CREATE INDEX "marketplace_settlements_provider_providerReference_idx"
ON "marketplace_settlements"("provider", "providerReference");

ALTER TABLE "marketplace_settlements"
ADD CONSTRAINT "marketplace_settlements_paymentId_fkey"
FOREIGN KEY ("paymentId")
REFERENCES "marketplace_payments"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "marketplace_settlements"
ADD CONSTRAINT "marketplace_settlements_transactionId_fkey"
FOREIGN KEY ("transactionId")
REFERENCES "marketplace_transactions"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "marketplace_settlements"
ADD CONSTRAINT "marketplace_settlements_sellerId_fkey"
FOREIGN KEY ("sellerId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
