-- AlterTable
ALTER TABLE "LocalCredential" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing passwords were set when their credential was created; backdating keeps
-- every current guest session valid across this deploy.
UPDATE "LocalCredential" SET "passwordChangedAt" = "createdAt";
