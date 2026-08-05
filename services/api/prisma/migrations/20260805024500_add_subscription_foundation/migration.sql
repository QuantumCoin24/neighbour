CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PLUS', 'BUSINESS');

CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

CREATE TYPE "SubscriptionProvider" AS ENUM ('INTERNAL', 'APPLE', 'STRIPE');

CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "SubscriptionProvider" NOT NULL DEFAULT 'INTERNAL',
    "externalReference" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscriptions_ownerId_idx"
ON "subscriptions"("ownerId");

CREATE INDEX "subscriptions_status_idx"
ON "subscriptions"("status");

CREATE INDEX "subscriptions_plan_idx"
ON "subscriptions"("plan");

CREATE INDEX "subscriptions_provider_idx"
ON "subscriptions"("provider");

ALTER TABLE "subscriptions"
ADD CONSTRAINT "subscriptions_ownerId_fkey"
FOREIGN KEY ("ownerId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
