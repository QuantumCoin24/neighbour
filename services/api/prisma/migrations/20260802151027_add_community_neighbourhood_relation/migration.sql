-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "neighbourhoodId" UUID;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "neighbourhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
