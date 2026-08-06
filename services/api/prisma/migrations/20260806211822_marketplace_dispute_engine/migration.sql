-- CreateEnum
CREATE TYPE "MarketplaceDisputeStatus" AS ENUM ('OPEN', 'AWAITING_RESPONSE', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplaceDisputePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MarketplaceDisputeReason" AS ENUM ('ITEM_NOT_RECEIVED', 'ITEM_NOT_AS_DESCRIBED', 'DAMAGED_ITEM', 'PAYMENT_NOT_RECEIVED', 'COLLECTION_NO_SHOW', 'DELIVERY_PROBLEM', 'UNAUTHORISED_PAYMENT', 'REFUND_NOT_RECEIVED', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketplaceDisputeResolution" AS ENUM ('NO_ACTION', 'BUYER_REFUND', 'PARTIAL_REFUND', 'SELLER_PAYMENT_RELEASE', 'RETURN_ITEM', 'REPLACEMENT', 'MUTUAL_AGREEMENT', 'ACCOUNT_RESTRICTION');

-- CreateEnum
CREATE TYPE "MarketplaceDisputeEvidenceType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'RECEIPT', 'TRACKING', 'CONVERSATION', 'PAYMENT_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketplaceDisputeEventType" AS ENUM ('CREATED', 'RESPONSE_REQUESTED', 'RESPONSE_ADDED', 'MESSAGE_ADDED', 'EVIDENCE_ADDED', 'REVIEW_STARTED', 'ESCALATED', 'ASSIGNED', 'RESOLUTION_PROPOSED', 'RESOLVED', 'CLOSED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUND_COMPLETED', 'REPUTATION_UPDATED');

-- CreateTable
CREATE TABLE "marketplace_disputes" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "paymentId" UUID,
    "fulfilmentId" UUID,
    "openedById" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "assignedToId" UUID,
    "reason" "MarketplaceDisputeReason" NOT NULL,
    "status" "MarketplaceDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MarketplaceDisputePriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedResolution" TEXT,
    "proposedResolution" TEXT,
    "resolution" "MarketplaceDisputeResolution",
    "resolutionDecision" TEXT,
    "resolutionInstructions" TEXT,
    "refundAmountPence" INTEGER,
    "responseDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "reviewStartedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_dispute_evidence" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "type" "MarketplaceDisputeEvidenceType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_dispute_messages" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_dispute_events" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "actorId" UUID,
    "type" "MarketplaceDisputeEventType" NOT NULL,
    "fromStatus" "MarketplaceDisputeStatus",
    "toStatus" "MarketplaceDisputeStatus" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_dispute_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_disputes_transactionId_status_createdAt_idx" ON "marketplace_disputes"("transactionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_disputes_buyerId_status_createdAt_idx" ON "marketplace_disputes"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_disputes_sellerId_status_createdAt_idx" ON "marketplace_disputes"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_disputes_openedById_createdAt_idx" ON "marketplace_disputes"("openedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_disputes_assignedToId_status_idx" ON "marketplace_disputes"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "marketplace_disputes_status_priority_createdAt_idx" ON "marketplace_disputes"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_disputes_responseDueAt_status_idx" ON "marketplace_disputes"("responseDueAt", "status");

-- CreateIndex
CREATE INDEX "marketplace_disputes_paymentId_idx" ON "marketplace_disputes"("paymentId");

-- CreateIndex
CREATE INDEX "marketplace_disputes_fulfilmentId_idx" ON "marketplace_disputes"("fulfilmentId");

-- CreateIndex
CREATE INDEX "marketplace_dispute_evidence_disputeId_createdAt_idx" ON "marketplace_dispute_evidence"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_evidence_uploadedById_createdAt_idx" ON "marketplace_dispute_evidence"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_evidence_mediaId_idx" ON "marketplace_dispute_evidence"("mediaId");

-- CreateIndex
CREATE INDEX "marketplace_dispute_evidence_type_createdAt_idx" ON "marketplace_dispute_evidence"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_dispute_evidence_disputeId_mediaId_key" ON "marketplace_dispute_evidence"("disputeId", "mediaId");

-- CreateIndex
CREATE INDEX "marketplace_dispute_messages_disputeId_createdAt_idx" ON "marketplace_dispute_messages"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_messages_authorId_createdAt_idx" ON "marketplace_dispute_messages"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_events_disputeId_createdAt_idx" ON "marketplace_dispute_events"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_events_actorId_createdAt_idx" ON "marketplace_dispute_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_events_type_createdAt_idx" ON "marketplace_dispute_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_dispute_events_toStatus_createdAt_idx" ON "marketplace_dispute_events"("toStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "marketplace_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "marketplace_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_fulfilmentId_fkey" FOREIGN KEY ("fulfilmentId") REFERENCES "marketplace_fulfilments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_evidence" ADD CONSTRAINT "marketplace_dispute_evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "marketplace_disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_evidence" ADD CONSTRAINT "marketplace_dispute_evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_evidence" ADD CONSTRAINT "marketplace_dispute_evidence_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_messages" ADD CONSTRAINT "marketplace_dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "marketplace_disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_messages" ADD CONSTRAINT "marketplace_dispute_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_events" ADD CONSTRAINT "marketplace_dispute_events_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "marketplace_disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dispute_events" ADD CONSTRAINT "marketplace_dispute_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
