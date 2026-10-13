-- Every contestant is on a team (a team of one by default), submissions record the
-- team they were made for, and joining a team goes through an accepted invite.

-- CreateEnum
CREATE TYPE "TeamInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_INVITE';

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "maxTeamSize" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "contestId" TEXT;

-- Copy each membership's contest from its team (null for admin research groups)
UPDATE "TeamMember" tm
SET "contestId" = t."contestId"
FROM "Team" t
WHERE tm."teamId" = t."id";

-- A team of one for every contestant who is not on a team yet, named like the scoreboard names them
INSERT INTO "Team" ("id", "name", "contestId", "createdAt", "updatedAt")
SELECT
  'solo_' || md5(p."contestId" || ':' || p."userId"),
  COALESCE(
    NULLIF(btrim(u."nickname"), ''),
    NULLIF(btrim(u."firstName" || ' ' || u."lastName"), ''),
    u."computingId"
  ),
  p."contestId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Participation" p
JOIN "User" u ON u."id" = p."userId"
WHERE p."role" = 'contestant'
  AND NOT EXISTS (
    SELECT 1 FROM "TeamMember" tm
    WHERE tm."userId" = p."userId" AND tm."contestId" = p."contestId"
  );

INSERT INTO "TeamMember" ("id", "teamId", "userId", "contestId")
SELECT
  'solo_member_' || md5(p."contestId" || ':' || p."userId"),
  t."id",
  p."userId",
  p."contestId"
FROM "Participation" p
JOIN "Team" t ON t."id" = 'solo_' || md5(p."contestId" || ':' || p."userId")
WHERE p."role" = 'contestant'
  AND NOT EXISTS (
    SELECT 1 FROM "TeamMember" tm
    WHERE tm."userId" = p."userId" AND tm."contestId" = p."contestId"
  );

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "teamId" TEXT;

-- Past submissions belong to the submitter's team as it is today
UPDATE "Submission" s
SET "teamId" = tm."teamId"
FROM "TeamMember" tm
WHERE tm."userId" = s."userId" AND tm."contestId" = s."contestId";

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "TeamInviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_invitedUserId_status_idx" ON "TeamInvite"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_status_idx" ON "TeamInvite"("teamId", "status");

-- CreateIndex (after the backfill, so it holds for existing rows too)
CREATE UNIQUE INDEX "TeamMember_contestId_userId_key" ON "TeamMember"("contestId", "userId");

-- CreateIndex
CREATE INDEX "Submission_teamId_idx" ON "Submission"("teamId");

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
