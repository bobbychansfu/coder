-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "constraints" TEXT,
ADD COLUMN     "exampleExplanation" TEXT,
ADD COLUMN     "exampleInput" TEXT,
ADD COLUMN     "exampleOutput" TEXT,
ADD COLUMN     "inputFormat" TEXT,
ADD COLUMN     "outputFormat" TEXT;
