-- CreateEnum
CREATE TYPE "MarketplaceReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "MarketplaceReputationLevel" AS ENUM ('NEW', 'DEVELOPING', 'TRUSTED', 'HIGHLY_TRUSTED', 'EXCEPTIONAL');

-- CreateEnum
CREATE TYPE "MarketplaceReputationEventType" AS ENUM ('REVIEW_CREATED', 'REVIEW_UPDATED', 'REVIEW_PUBLISHED', 'REVIEW_RESPONDED', 'REVIEW_REPORTED', 'REVIEW_HIDDEN', 'REVIEW_REMOVED', 'SCORE_RECALCULATED', 'BADGE_AWARDED', 'BADGE_REVOKED');

-- CreateEnum
CREATE TYPE "MarketplaceReputationBadgeCode" AS ENUM ('FIRST_TRADE', 'VERIFIED_TRADER', 'RELIABLE_BUYER', 'RELIABLE_SELLER', 'TEN_SUCCESSFUL_TRADES', 'FIFTY_SUCCESSFUL_TRADES', 'HUNDRED_SUCCESSFUL_TRADES', 'FIVE_STAR_TRADER', 'FAST_RESPONDER', 'COMMUNITY_TRUSTED');

-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "response" TEXT,
    "status" "MarketplaceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedTransaction" BOOLEAN NOT NULL DEFAULT true,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_review_reports" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reputation_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "level" "MarketplaceReputationLevel" NOT NULL DEFAULT 'NEW',
    "completedTransactions" INTEGER NOT NULL DEFAULT 0,
    "successfulPurchases" INTEGER NOT NULL DEFAULT 0,
    "successfulSales" INTEGER NOT NULL DEFAULT 0,
    "cancelledTransactions" INTEGER NOT NULL DEFAULT 0,
    "disputedTransactions" INTEGER NOT NULL DEFAULT 0,
    "verifiedReviews" INTEGER NOT NULL DEFAULT 0,
    "positiveReviews" INTEGER NOT NULL DEFAULT 0,
    "neutralReviews" INTEGER NOT NULL DEFAULT 0,
    "negativeReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "cancellationRate" DOUBLE PRECISION,
    "disputeRate" DOUBLE PRECISION,
    "responseRate" DOUBLE PRECISION,
    "averageResponseMinutes" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_reputation_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reputation_badges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code" "MarketplaceReputationBadgeCode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_reputation_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reputation_events" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actorId" UUID,
    "type" "MarketplaceReputationEventType" NOT NULL,
    "scoreBefore" INTEGER,
    "scoreAfter" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_reviews_subjectId_status_createdAt_idx" ON "marketplace_reviews"("subjectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_reviews_reviewerId_createdAt_idx" ON "marketplace_reviews"("reviewerId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_reviews_rating_status_idx" ON "marketplace_reviews"("rating", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reviews_transactionId_reviewerId_key" ON "marketplace_reviews"("transactionId", "reviewerId");

-- CreateIndex
CREATE INDEX "marketplace_review_reports_reviewId_createdAt_idx" ON "marketplace_review_reports"("reviewId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_review_reports_reporterId_createdAt_idx" ON "marketplace_review_reports"("reporterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_review_reports_reviewId_reporterId_key" ON "marketplace_review_reports"("reviewId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reputation_profiles_userId_key" ON "marketplace_reputation_profiles"("userId");

-- CreateIndex
CREATE INDEX "marketplace_reputation_profiles_score_calculatedAt_idx" ON "marketplace_reputation_profiles"("score", "calculatedAt");

-- CreateIndex
CREATE INDEX "marketplace_reputation_profiles_riskScore_calculatedAt_idx" ON "marketplace_reputation_profiles"("riskScore", "calculatedAt");

-- CreateIndex
CREATE INDEX "marketplace_reputation_profiles_level_score_idx" ON "marketplace_reputation_profiles"("level", "score");

-- CreateIndex
CREATE INDEX "marketplace_reputation_badges_userId_awardedAt_idx" ON "marketplace_reputation_badges"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "marketplace_reputation_badges_code_awardedAt_idx" ON "marketplace_reputation_badges"("code", "awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reputation_badges_userId_code_key" ON "marketplace_reputation_badges"("userId", "code");

-- CreateIndex
CREATE INDEX "marketplace_reputation_events_userId_createdAt_idx" ON "marketplace_reputation_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_reputation_events_type_createdAt_idx" ON "marketplace_reputation_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "marketplace_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_review_reports" ADD CONSTRAINT "marketplace_review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "marketplace_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_review_reports" ADD CONSTRAINT "marketplace_review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reputation_profiles" ADD CONSTRAINT "marketplace_reputation_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reputation_badges" ADD CONSTRAINT "marketplace_reputation_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reputation_events" ADD CONSTRAINT "marketplace_reputation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
