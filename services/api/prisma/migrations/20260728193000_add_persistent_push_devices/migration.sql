-- CreateTable
CREATE TABLE "push_devices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceName" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_token_key"
ON "push_devices"("token");

-- CreateIndex
CREATE INDEX "push_devices_userId_revokedAt_idx"
ON "push_devices"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "push_devices_platform_revokedAt_idx"
ON "push_devices"("platform", "revokedAt");

-- CreateIndex
CREATE INDEX "push_devices_lastSeenAt_idx"
ON "push_devices"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "push_devices"
ADD CONSTRAINT "push_devices_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
