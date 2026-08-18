-- Build 53:
-- Preserve historical marketplace transactions while allowing a listing
-- to be purchased again after a previous transaction is cancelled.

DROP INDEX IF EXISTS "marketplace_transactions_listingId_key";

CREATE INDEX IF NOT EXISTS "marketplace_transactions_listingId_idx"
ON "marketplace_transactions"("listingId");
