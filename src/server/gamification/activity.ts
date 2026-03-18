import { prisma } from "@/lib/prisma";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function recordDailyLogin(userId: string): Promise<void> {
  const today = startOfUtcDay(new Date());
  const existing = await prisma.userActivity.findFirst({
    where: {
      userId,
      type: "login",
      createdAt: { gte: today },
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.userActivity.create({
    data: {
      userId,
      type: "login",
      name: "Logged in",
    },
  });
}

export async function createRankUpActivity(userId: string, rankLabel: string): Promise<void> {
  await prisma.userActivity.create({
    data: {
      userId,
      type: "rank_up",
      name: `Achieved the rank of ${rankLabel}`,
    },
  });
}
