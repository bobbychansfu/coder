ALTER TYPE "UserRole" ADD VALUE 'GUEST';

CREATE TABLE "LocalCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalCredential_userId_key" ON "LocalCredential"("userId");
CREATE UNIQUE INDEX "LocalCredential_username_key" ON "LocalCredential"("username");

ALTER TABLE "LocalCredential"
ADD CONSTRAINT "LocalCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
