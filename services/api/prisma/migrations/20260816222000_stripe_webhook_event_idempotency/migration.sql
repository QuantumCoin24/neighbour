CREATE TABLE "stripe_webhook_events" (
    "id" UUID NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "providerObjectId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_webhook_events_stripeEventId_key"
ON "stripe_webhook_events"("stripeEventId");

CREATE INDEX "stripe_webhook_events_type_processedAt_idx"
ON "stripe_webhook_events"("type", "processedAt");

CREATE INDEX "stripe_webhook_events_providerObjectId_idx"
ON "stripe_webhook_events"("providerObjectId");
