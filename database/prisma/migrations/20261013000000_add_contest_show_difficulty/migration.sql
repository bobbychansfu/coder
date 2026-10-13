-- AlterTable: contests hide problem difficulty unless the setter shows it.
ALTER TABLE "Contest" ADD COLUMN     "showDifficulty" BOOLEAN NOT NULL DEFAULT false;
