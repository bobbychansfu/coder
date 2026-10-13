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

// Logging every SQL query floods the dev terminal, so it is opt-in: set
// PRISMA_LOG_QUERIES=true while debugging a query. Production logs errors only.
function getPrismaLogLevels(): ("query" | "warn" | "error")[] {
  if (process.env.NODE_ENV !== "development") return ["error"];
  return process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "error", "warn"] : ["error", "warn"];
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: getPrismaLogLevels(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
