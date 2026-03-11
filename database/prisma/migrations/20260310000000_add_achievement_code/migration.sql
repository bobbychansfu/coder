-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");
