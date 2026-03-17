ALTER TABLE "Achievement" ADD COLUMN "code" TEXT;

CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");
