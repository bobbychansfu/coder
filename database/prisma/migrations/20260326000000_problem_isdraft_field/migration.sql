-- Add isDraft column to Problem, backfill from ManageLifecycleStatus.DRAFT, then retire that value
ALTER TABLE "Problem" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing DRAFT problems become isDraft=true with manageStatus=ACTIVE
UPDATE "Problem" SET "isDraft" = true WHERE "manageStatus" = 'DRAFT';
UPDATE "Problem" SET "manageStatus" = 'ACTIVE' WHERE "manageStatus" = 'DRAFT';
