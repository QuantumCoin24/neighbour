-- CreateEnum
CREATE TYPE "MarketplacePaymentProvider" AS ENUM ('MANUAL', 'STRIPE', 'ADYEN', 'QFN');

-- CreateEnum
CREATE TYPE "MarketplacePaymentMethod" AS ENUM ('CASH_ON_COLLECTION', 'BANK_TRANSFER', 'CARD', 'APPLE_PAY', 'QFN');

-- CreateEnum
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('PENDING', 'REQUIRES_ACTION', 'AUTHORISED', 'CAPTURED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MarketplaceRefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplacePaymentEventType" AS ENUM ('CREATED', 'ACTION_REQUIRED', 'AUTHORISED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUND_COMPLETED', 'REFUND_FAILED');

-- CreateTable
CREATE TABLE "marketplace_payments" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "provider" "MarketplacePaymentProvider" NOT NULL,
    "method" "MarketplacePaymentMethod" NOT NULL,
    "status" "MarketplacePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "providerReference" TEXT,
    "clientSecret" TEXT,
    "manualReference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "authorisedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAmountPence" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_refunds" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "status" "MarketplaceRefundStatus" NOT NULL DEFAULT 'PENDING',
    "amountPence" INTEGER NOT NULL,
    "reason" TEXT,
    "providerReference" TEXT,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_payment_events" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "type" "MarketplacePaymentEventType" NOT NULL,
    "fromStatus" "MarketplacePaymentStatus",
    "toStatus" "MarketplacePaymentStatus" NOT NULL,
    "amountPence" INTEGER,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_payments_idempotencyKey_key" ON "marketplace_payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "marketplace_payments_transactionId_status_createdAt_idx" ON "marketplace_payments"("transactionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_payments_buyerId_status_createdAt_idx" ON "marketplace_payments"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_payments_sellerId_status_createdAt_idx" ON "marketplace_payments"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_payments_provider_providerReference_idx" ON "marketplace_payments"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "marketplace_payments_status_expiresAt_idx" ON "marketplace_payments"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_payments_transactionId_id_key" ON "marketplace_payments"("transactionId", "id");

-- CreateIndex
CREATE INDEX "marketplace_refunds_paymentId_status_createdAt_idx" ON "marketplace_refunds"("paymentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_refunds_requestedById_createdAt_idx" ON "marketplace_refunds"("requestedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_refunds_status_requestedAt_idx" ON "marketplace_refunds"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "marketplace_payment_events_paymentId_createdAt_idx" ON "marketplace_payment_events"("paymentId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_payment_events_actorId_createdAt_idx" ON "marketplace_payment_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_payment_events_type_createdAt_idx" ON "marketplace_payment_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "marketplace_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_refunds" ADD CONSTRAINT "marketplace_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "marketplace_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_refunds" ADD CONSTRAINT "marketplace_refunds_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payment_events" ADD CONSTRAINT "marketplace_payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "marketplace_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payment_events" ADD CONSTRAINT "marketplace_payment_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
