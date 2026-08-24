-- Reconcile an index represented in the Prisma schema but missing from
-- the historical local database migration state.
--
-- IF NOT EXISTS keeps this migration safe for databases where the
-- expected index is already present.

CREATE INDEX IF NOT EXISTS "marketplace_offers_listingId_idx"
ON "marketplace_offers"("listingId");
