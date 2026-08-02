-- CreateTable
CREATE TABLE "neighbourhoods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "localArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neighbourhoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neighbourhood_memberships" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "neighbourhoodId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighbourhood_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "neighbourhoods_localArea_idx" ON "neighbourhoods"("localArea");

-- CreateIndex
CREATE INDEX "neighbourhood_memberships_userId_idx" ON "neighbourhood_memberships"("userId");

-- CreateIndex
CREATE INDEX "neighbourhood_memberships_neighbourhoodId_idx" ON "neighbourhood_memberships"("neighbourhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "neighbourhood_memberships_userId_neighbourhoodId_key" ON "neighbourhood_memberships"("userId", "neighbourhoodId");

-- AddForeignKey
ALTER TABLE "neighbourhood_memberships" ADD CONSTRAINT "neighbourhood_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neighbourhood_memberships" ADD CONSTRAINT "neighbourhood_memberships_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "neighbourhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
