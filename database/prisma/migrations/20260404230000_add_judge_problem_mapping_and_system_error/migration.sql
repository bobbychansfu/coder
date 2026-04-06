ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'SYSTEM_ERROR';

ALTER TABLE "Problem"
ADD COLUMN IF NOT EXISTS "judgeProblemId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Problem_judgeProblemId_key"
ON "Problem"("judgeProblemId");
