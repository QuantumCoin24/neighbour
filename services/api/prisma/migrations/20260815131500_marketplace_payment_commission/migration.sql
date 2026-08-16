-- Neighbour™ Marketplace Payment Commission Ledger
--
-- Existing marketplace payments pre-date platform commission:
--   platform fee = 0
--   processor fee = 0
--   seller proceeds = original gross amount
--
-- New marketplace payments use the schema/service default of 750 basis points (7.5%).

ALTER TABLE "marketplace_payments"
ADD COLUMN "platformFeeBasisPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "platformFeePence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "processorFeePence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sellerProceedsPence" INTEGER NOT NULL DEFAULT 0;

UPDATE "marketplace_payments"
SET "sellerProceedsPence" = "amountPence";

ALTER TABLE "marketplace_payments"
ALTER COLUMN "platformFeeBasisPoints" SET DEFAULT 750;
