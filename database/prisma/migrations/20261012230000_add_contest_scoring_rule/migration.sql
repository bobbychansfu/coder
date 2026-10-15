-- CreateEnum
CREATE TYPE "ContestScoringRule" AS ENUM ('POINTS', 'ICPC');

-- AlterTable: existing contests keep ranking by problem points.
ALTER TABLE "Contest" ADD COLUMN     "scoringRule" "ContestScoringRule" NOT NULL DEFAULT 'POINTS';
