-- AlterTable: once a contest ends, the setter may open it to every student for upsolving.
ALTER TABLE "Contest" ADD COLUMN     "openForUpsolving" BOOLEAN NOT NULL DEFAULT false;
