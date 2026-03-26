ALTER TABLE "PracticeRunRecord"
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "problemId" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'practice',
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'queued',
ADD COLUMN IF NOT EXISTS "score" INTEGER,
ADD COLUMN IF NOT EXISTS "feedback" TEXT,
ADD COLUMN IF NOT EXISTS "testcases" JSONB,
ADD COLUMN IF NOT EXISTS "judgedBy" TEXT,
ADD COLUMN IF NOT EXISTS "rawProviderResponse" JSONB,
ADD COLUMN IF NOT EXISTS "errorMessage" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "PracticeRunRecord" AS prr
SET
  "userId" = ps."userId",
  "problemId" = ps."problemId",
  "updatedAt" = prr."createdAt"
FROM "PracticeSession" AS ps
WHERE ps."id" = prr."sessionId"
  AND (
    prr."userId" IS NULL
    OR prr."problemId" IS NULL
    OR prr."updatedAt" IS NULL
  );

ALTER TABLE "PracticeRunRecord"
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "problemId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "PracticeRunRecord_status_updatedAt_idx"
ON "PracticeRunRecord"("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "PracticeRunRecord_userId_problemId_createdAt_idx"
ON "PracticeRunRecord"("userId", "problemId", "createdAt");
