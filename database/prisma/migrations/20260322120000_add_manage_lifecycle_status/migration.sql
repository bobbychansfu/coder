CREATE TYPE "ManageLifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

ALTER TABLE "Contest"
ADD COLUMN "manageStatus" "ManageLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Problem"
ADD COLUMN "manageStatus" "ManageLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';
