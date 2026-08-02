-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "neighbourhoodId" UUID;

-- CreateIndex
CREATE INDEX "posts_neighbourhoodId_status_publishedAt_idx" ON "posts"("neighbourhoodId", "status", "publishedAt");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "neighbourhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
