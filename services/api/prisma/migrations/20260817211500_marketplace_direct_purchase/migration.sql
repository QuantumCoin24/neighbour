-- Build 47: permit a Marketplace transaction to originate from
-- either an accepted offer or a direct Buy Now purchase.
ALTER TABLE "marketplace_transactions"
ALTER COLUMN "acceptedOfferId" DROP NOT NULL;
