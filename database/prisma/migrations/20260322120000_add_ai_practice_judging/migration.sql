-- AlterTable
ALTER TABLE "PracticeRunRecord"
ADD COLUMN "userId" TEXT,
ADD COLUMN "problemId" TEXT,
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'practice',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'queued',
ADD COLUMN "score" INTEGER,
ADD COLUMN "feedback" TEXT,
ADD COLUMN "testcases" JSONB,
ADD COLUMN "judgedBy" TEXT,
ADD COLUMN "rawProviderResponse" JSONB,
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from the owning practice session for existing rows.
UPDATE "PracticeRunRecord" AS run
SET
  "userId" = session."userId",
  "problemId" = session."problemId"
FROM "PracticeSession" AS session
WHERE run."sessionId" = session."id";

ALTER TABLE "PracticeRunRecord"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "problemId" SET NOT NULL;

-- Indexes
CREATE INDEX "PracticeRunRecord_userId_problemId_createdAt_idx"
ON "PracticeRunRecord"("userId", "problemId", "createdAt");

CREATE INDEX "PracticeRunRecord_status_updatedAt_idx"
ON "PracticeRunRecord"("status", "updatedAt");
