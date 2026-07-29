-- AlterTable
ALTER TABLE "Team" ADD COLUMN "contestId" TEXT;

-- CreateIndex
CREATE INDEX "Team_contestId_idx" ON "Team"("contestId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_contestId_fkey"
FOREIGN KEY ("contestId") REFERENCES "Contest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
