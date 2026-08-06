-- CreateEnum
CREATE TYPE "MarketplaceModerationSubjectType" AS ENUM ('LISTING', 'USER', 'TRANSACTION', 'PAYMENT', 'FULFILMENT', 'REVIEW', 'DISPUTE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "MarketplaceModerationStatus" AS ENUM ('OPEN', 'TRIAGED', 'UNDER_REVIEW', 'AWAITING_INFORMATION', 'ACTION_REQUIRED', 'RESOLVED', 'DISMISSED', 'APPEALED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MarketplaceModerationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MarketplaceModerationReason" AS ENUM ('FRAUD_SUSPECTED', 'PROHIBITED_ITEM', 'MISLEADING_LISTING', 'COUNTERFEIT_ITEM', 'PAYMENT_ABUSE', 'HARASSMENT', 'THREAT_OR_SAFETY', 'SPAM', 'REVIEW_ABUSE', 'REPEAT_CANCELLATION', 'DISPUTE_ABUSE', 'IDENTITY_RISK', 'OTHER');

-- CreateEnum
CREATE TYPE "MarketplaceFraudSignalType" AS ENUM ('PAYMENT_PATTERN', 'ACCOUNT_PATTERN', 'LISTING_PATTERN', 'MESSAGE_PATTERN', 'DEVICE_PATTERN', 'IDENTITY_PATTERN', 'DISPUTE_PATTERN', 'REVIEW_PATTERN', 'VELOCITY_PATTERN', 'MANUAL_REPORT');

-- CreateEnum
CREATE TYPE "MarketplaceModerationActionType" AS ENUM ('NO_ACTION', 'WARNING', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'LISTING_SUSPENDED', 'LISTING_REMOVED', 'MARKETPLACE_RESTRICTED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_TERMINATED', 'PAYMENT_HOLD', 'REFUND_REQUIRED', 'IDENTITY_REVERIFICATION');

-- CreateEnum
CREATE TYPE "MarketplaceModerationAppealDecision" AS ENUM ('UPHELD', 'PARTIALLY_UPHELD', 'OVERTURNED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "MarketplaceModerationEventType" AS ENUM ('CASE_CREATED', 'RISK_RECALCULATED', 'FRAUD_SIGNAL_ADDED', 'TRIAGED', 'ASSIGNED', 'REVIEW_STARTED', 'INFORMATION_REQUESTED', 'STATUS_CHANGED', 'ACTION_APPLIED', 'ACTION_REVOKED', 'APPEAL_CREATED', 'APPEAL_RESOLVED', 'CASE_RESOLVED', 'CASE_DISMISSED', 'CASE_CLOSED');

-- CreateTable
CREATE TABLE "marketplace_moderation_cases" (
    "id" UUID NOT NULL,
    "subjectType" "MarketplaceModerationSubjectType" NOT NULL,
    "subjectId" UUID NOT NULL,
    "reportedUserId" UUID,
    "openedById" UUID,
    "assignedToId" UUID,
    "status" "MarketplaceModerationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MarketplaceModerationPriority" NOT NULL DEFAULT 'NORMAL',
    "reason" "MarketplaceModerationReason" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "fraudScore" INTEGER NOT NULL DEFAULT 0,
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triagedAt" TIMESTAMP(3),
    "reviewStartedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_fraud_signals" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "createdById" UUID,
    "type" "MarketplaceFraudSignalType" NOT NULL,
    "subjectId" UUID NOT NULL,
    "weight" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_moderation_actions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "appliedById" UUID NOT NULL,
    "type" "MarketplaceModerationActionType" NOT NULL,
    "decision" TEXT NOT NULL,
    "instructions" TEXT,
    "durationHours" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_moderation_appeals" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "appellantId" UUID NOT NULL,
    "grounds" TEXT NOT NULL,
    "requestedOutcome" TEXT NOT NULL,
    "decision" "MarketplaceModerationAppealDecision",
    "decisionReasons" TEXT,
    "reviewedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_moderation_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_moderation_events" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "actorId" UUID,
    "type" "MarketplaceModerationEventType" NOT NULL,
    "fromStatus" "MarketplaceModerationStatus",
    "toStatus" "MarketplaceModerationStatus" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_moderation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_subjectType_subjectId_idx" ON "marketplace_moderation_cases"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_reportedUserId_status_createdA_idx" ON "marketplace_moderation_cases"("reportedUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_openedById_createdAt_idx" ON "marketplace_moderation_cases"("openedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_assignedToId_status_priority_idx" ON "marketplace_moderation_cases"("assignedToId", "status", "priority");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_status_priority_createdAt_idx" ON "marketplace_moderation_cases"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_riskScore_status_idx" ON "marketplace_moderation_cases"("riskScore", "status");

-- CreateIndex
CREATE INDEX "marketplace_moderation_cases_fraudScore_status_idx" ON "marketplace_moderation_cases"("fraudScore", "status");

-- CreateIndex
CREATE INDEX "marketplace_fraud_signals_caseId_createdAt_idx" ON "marketplace_fraud_signals"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_fraud_signals_subjectId_type_idx" ON "marketplace_fraud_signals"("subjectId", "type");

-- CreateIndex
CREATE INDEX "marketplace_fraud_signals_type_weight_idx" ON "marketplace_fraud_signals"("type", "weight");

-- CreateIndex
CREATE INDEX "marketplace_moderation_actions_caseId_createdAt_idx" ON "marketplace_moderation_actions"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_actions_appliedById_createdAt_idx" ON "marketplace_moderation_actions"("appliedById", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_actions_type_startsAt_idx" ON "marketplace_moderation_actions"("type", "startsAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_actions_expiresAt_revokedAt_idx" ON "marketplace_moderation_actions"("expiresAt", "revokedAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_appeals_caseId_createdAt_idx" ON "marketplace_moderation_appeals"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_appeals_appellantId_createdAt_idx" ON "marketplace_moderation_appeals"("appellantId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_appeals_decision_resolvedAt_idx" ON "marketplace_moderation_appeals"("decision", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_moderation_appeals_caseId_appellantId_key" ON "marketplace_moderation_appeals"("caseId", "appellantId");

-- CreateIndex
CREATE INDEX "marketplace_moderation_events_caseId_createdAt_idx" ON "marketplace_moderation_events"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_events_actorId_createdAt_idx" ON "marketplace_moderation_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_events_type_createdAt_idx" ON "marketplace_moderation_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_moderation_events_toStatus_createdAt_idx" ON "marketplace_moderation_events"("toStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "marketplace_moderation_cases" ADD CONSTRAINT "marketplace_moderation_cases_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_cases" ADD CONSTRAINT "marketplace_moderation_cases_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_cases" ADD CONSTRAINT "marketplace_moderation_cases_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fraud_signals" ADD CONSTRAINT "marketplace_fraud_signals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "marketplace_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_fraud_signals" ADD CONSTRAINT "marketplace_fraud_signals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_actions" ADD CONSTRAINT "marketplace_moderation_actions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "marketplace_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_actions" ADD CONSTRAINT "marketplace_moderation_actions_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_appeals" ADD CONSTRAINT "marketplace_moderation_appeals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "marketplace_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_appeals" ADD CONSTRAINT "marketplace_moderation_appeals_appellantId_fkey" FOREIGN KEY ("appellantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_events" ADD CONSTRAINT "marketplace_moderation_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "marketplace_moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_moderation_events" ADD CONSTRAINT "marketplace_moderation_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
