-- Private contest access: an allowlist of computing IDs / emails, and an
-- optional join link whose code lets anyone signed in add themselves to it.

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "joinCode" TEXT;

-- CreateTable
CREATE TABLE "ContestAllowedUser" (
    "contestId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestAllowedUser_pkey" PRIMARY KEY ("contestId","identifier")
);

-- AddForeignKey
ALTER TABLE "ContestAllowedUser" ADD CONSTRAINT "ContestAllowedUser_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
