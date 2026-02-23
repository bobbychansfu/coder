import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER ?? "postgres";
  const password = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB ?? "judge";
  const port = process.env.DB_PORT ?? "5432";

  if (!password) {
    throw new Error("Missing POSTGRES_PASSWORD. Set it in .env or set DATABASE_URL explicitly.");
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:${port}/${db}?schema=public`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
