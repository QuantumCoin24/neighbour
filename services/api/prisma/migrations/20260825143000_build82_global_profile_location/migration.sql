ALTER TABLE "user_profiles"
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "latitude" DECIMAL(9,6),
ADD COLUMN "longitude" DECIMAL(9,6);

CREATE INDEX "user_profiles_postalCode_idx"
ON "user_profiles"("postalCode");

CREATE INDEX "user_profiles_countryCode_idx"
ON "user_profiles"("countryCode");

CREATE INDEX "user_profiles_latitude_longitude_idx"
ON "user_profiles"("latitude", "longitude");
