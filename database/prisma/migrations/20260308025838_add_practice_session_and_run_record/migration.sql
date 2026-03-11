-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstRunAt" TIMESTAMP(3),
    "firstSubmitAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeRunRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "compilePassed" BOOLEAN NOT NULL DEFAULT false,
    "stdout" TEXT,
    "stderr" TEXT,
    "runtimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeRunRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSession_userId_problemCode_key" ON "PracticeSession"("userId", "problemCode");

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeRunRecord" ADD CONSTRAINT "PracticeRunRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
