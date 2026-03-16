ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'COMPILE_ERROR';

CREATE TYPE "CodingLanguage" AS ENUM ('CPLUSPLUS', 'JAVA', 'TYPESCRIPT', 'JAVASCRIPT', 'PYTHON');
CREATE TYPE "ProblemSource" AS ENUM ('PRACTICE', 'CONTEST', 'BOTH');
CREATE TYPE "ExperimentGroup" AS ENUM ('A', 'B', 'C');
CREATE TYPE "AssignmentMethod" AS ENUM ('MANUAL', 'RANDOM', 'RATIO_RANDOM');

ALTER TABLE "Contest"
ADD COLUMN     "aiHintEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Problem"
ADD COLUMN     "source" "ProblemSource" NOT NULL DEFAULT 'BOTH';

ALTER TABLE "Participation"
ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assignmentMethod" "AssignmentMethod",
ADD COLUMN     "experimentGroup" "ExperimentGroup";

ALTER TABLE "PracticeSession"
ADD COLUMN     "problemId" TEXT,
ADD COLUMN     "selectedLang" "CodingLanguage",
ADD COLUMN     "solvedAt" TIMESTAMP(3),
ADD COLUMN     "submitCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "PracticeSession" AS ps
SET "problemId" = p."id"
FROM "Problem" AS p
WHERE p."code" = ps."problemCode";

DELETE FROM "PracticeSession"
WHERE "problemId" IS NULL;

DELETE FROM "PracticeRunRecord"
WHERE LOWER("language") NOT IN ('cpp', 'c++', 'c++17', 'java', 'typescript', 'javascript', 'python', 'python3');

DELETE FROM "Submission"
WHERE LOWER("language") NOT IN ('cpp', 'c++', 'c++17', 'java', 'typescript', 'javascript', 'python', 'python3');

ALTER TABLE "PracticeRunRecord"
ALTER COLUMN "language" TYPE "CodingLanguage"
USING (
  CASE LOWER("language")
    WHEN 'cpp' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'cplusplus' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'c++' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'c++17' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'java' THEN 'JAVA'::"CodingLanguage"
    WHEN 'typescript' THEN 'TYPESCRIPT'::"CodingLanguage"
    WHEN 'javascript' THEN 'JAVASCRIPT'::"CodingLanguage"
    WHEN 'python' THEN 'PYTHON'::"CodingLanguage"
    WHEN 'python3' THEN 'PYTHON'::"CodingLanguage"
  END
);

ALTER TABLE "Submission"
ALTER COLUMN "language" TYPE "CodingLanguage"
USING (
  CASE LOWER("language")
    WHEN 'cpp' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'cplusplus' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'c++' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'c++17' THEN 'CPLUSPLUS'::"CodingLanguage"
    WHEN 'java' THEN 'JAVA'::"CodingLanguage"
    WHEN 'typescript' THEN 'TYPESCRIPT'::"CodingLanguage"
    WHEN 'javascript' THEN 'JAVASCRIPT'::"CodingLanguage"
    WHEN 'python' THEN 'PYTHON'::"CodingLanguage"
    WHEN 'python3' THEN 'PYTHON'::"CodingLanguage"
  END
);

UPDATE "PracticeSession" AS ps
SET "selectedLang" = latest."language"
FROM (
  SELECT DISTINCT ON ("sessionId")
    "sessionId",
    "language"
  FROM "PracticeRunRecord"
  ORDER BY "sessionId", "createdAt" DESC
) AS latest
WHERE latest."sessionId" = ps."id";

UPDATE "PracticeSession" AS ps
SET "firstSubmitAt" = COALESCE(
  ps."firstSubmitAt",
  submit_data."firstSubmitAt"
),
"solvedAt" = solved_data."solvedAt",
"submitCount" = COALESCE(submit_data."submitCount", 0)
FROM (
  SELECT
    "sessionId",
    MIN("createdAt") AS "firstSubmitAt",
    COUNT(*)::INTEGER AS "submitCount"
  FROM "PracticeRunRecord"
  WHERE "isSubmit" = true
  GROUP BY "sessionId"
) AS submit_data
LEFT JOIN (
  SELECT
    "sessionId",
    MIN("createdAt") AS "solvedAt"
  FROM "PracticeRunRecord"
  WHERE "isSubmit" = true
    AND LOWER("verdict") = 'accepted'
  GROUP BY "sessionId"
) AS solved_data
ON solved_data."sessionId" = submit_data."sessionId"
WHERE submit_data."sessionId" = ps."id";

ALTER TABLE "PracticeSession"
ALTER COLUMN "problemId" SET NOT NULL;

ALTER TABLE "PracticeSession"
ADD CONSTRAINT "PracticeSession_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "PracticeSession_userId_problemCode_key";
CREATE UNIQUE INDEX "PracticeSession_userId_problemId_key" ON "PracticeSession"("userId", "problemId");
CREATE INDEX "PracticeSession_problemId_idx" ON "PracticeSession"("problemId");
CREATE INDEX "PracticeRunRecord_sessionId_createdAt_idx" ON "PracticeRunRecord"("sessionId", "createdAt");
ALTER TABLE "PracticeSession" DROP COLUMN "problemCode";

CREATE TABLE "ProblemStarterCode" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "CodingLanguage" NOT NULL,
    "code" TEXT NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generatedFrom" "CodingLanguage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemStarterCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestExperimentGroup" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "groupName" "ExperimentGroup" NOT NULL,
    "aiHintEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hintDelayMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestExperimentGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContestProblemSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstRunAt" TIMESTAMP(3),
    "firstSubmitAt" TIMESTAMP(3),
    "hintEligibleAt" TIMESTAMP(3),
    "hintTriggeredAt" TIMESTAMP(3),
    "solvedAt" TIMESTAMP(3),
    "selectedLang" "CodingLanguage",
    "solved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContestProblemSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProblemStarterCode_problemId_language_key" ON "ProblemStarterCode"("problemId", "language");
CREATE INDEX "ProblemStarterCode_problemId_idx" ON "ProblemStarterCode"("problemId");
CREATE UNIQUE INDEX "ContestExperimentGroup_contestId_groupName_key" ON "ContestExperimentGroup"("contestId", "groupName");
CREATE INDEX "ContestExperimentGroup_contestId_idx" ON "ContestExperimentGroup"("contestId");
CREATE UNIQUE INDEX "ContestProblemSession_userId_contestId_problemId_key" ON "ContestProblemSession"("userId", "contestId", "problemId");
CREATE INDEX "ContestProblemSession_contestId_problemId_idx" ON "ContestProblemSession"("contestId", "problemId");
CREATE INDEX "ContestProblemSession_userId_contestId_idx" ON "ContestProblemSession"("userId", "contestId");
CREATE INDEX "Participation_contestId_experimentGroup_idx" ON "Participation"("contestId", "experimentGroup");

ALTER TABLE "ProblemStarterCode" ADD CONSTRAINT "ProblemStarterCode_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestExperimentGroup" ADD CONSTRAINT "ContestExperimentGroup_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestProblemSession" ADD CONSTRAINT "ContestProblemSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestProblemSession" ADD CONSTRAINT "ContestProblemSession_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContestProblemSession" ADD CONSTRAINT "ContestProblemSession_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
