import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS, type PersistedBadge, dayKey, SEVEN_DAYS_MS } from "./shared";

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

export async function recordSyntheticSubmission(userId: string): Promise<void> {
  await prisma.userActivity.create({
    data: {
      userId,
      type: "metadata_submission",
      name: "Metadata submission trigger",
    },
  });
}

export async function getRecentActivityDatesByUser(
  userIds: string[],
  type: "login" | "metadata_submission",
): Promise<Map<string, Date[]>> {
  if (userIds.length === 0) {
    return new Map<string, Date[]>();
  }

  const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
  const rows = await prisma.userActivity.findMany({
    where: {
      userId: { in: userIds },
      type,
      createdAt: { gte: threshold },
    },
    select: {
      userId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, Date[]>();
  for (const row of rows) {
    const dates = grouped.get(row.userId) ?? [];
    dates.push(row.createdAt);
    grouped.set(row.userId, dates);
  }

  return grouped;
}

async function ensureBadgeCatalog() {
  await Promise.all(
    BADGE_DEFINITIONS.map((badge) =>
      prisma.achievement.upsert({
        where: { code: badge.code },
        update: {
          name: badge.name,
          description: badge.description,
        },
        create: {
          code: badge.code,
          name: badge.name,
          description: badge.description,
        },
      }),
    ),
  );

  const achievements = await prisma.achievement.findMany({
    where: { code: { in: BADGE_DEFINITIONS.map((badge) => badge.code) } },
    select: { id: true, code: true },
  });

  return new Map(achievements.map((achievement) => [achievement.code ?? "", achievement.id]));
}

export async function awardBadges(userId: string, eligibleCodes: string[]): Promise<void> {
  if (eligibleCodes.length === 0) {
    return;
  }

  const catalog = await ensureBadgeCatalog();
  const existing = await prisma.userAchievement.findMany({
    where: {
      userId,
      achievement: { code: { in: eligibleCodes } },
    },
    select: { achievement: { select: { code: true } } },
  });

  const existingCodes = new Set(existing.map((row) => row.achievement.code).filter(Boolean));
  const missingCodes = eligibleCodes.filter((code) => !existingCodes.has(code));

  if (missingCodes.length === 0) {
    return;
  }

  await prisma.userAchievement.createMany({
    data: missingCodes
      .map((code) => catalog.get(code))
      .filter((achievementId): achievementId is string => Boolean(achievementId))
      .map((achievementId) => ({ userId, achievementId })),
    skipDuplicates: true,
  });
}

export async function getPersistedBadges(userId: string): Promise<PersistedBadge[]> {
  await ensureBadgeCatalog();

  const awards = await prisma.userAchievement.findMany({
    where: {
      userId,
      achievement: { code: { in: BADGE_DEFINITIONS.map((badge) => badge.code) } },
    },
    include: {
      achievement: {
        select: {
          code: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { earnedAt: "desc" },
  });

  const awardedByCode = new Map(
    awards
      .filter((award) => award.achievement.code)
      .map((award) => [award.achievement.code as string, award.earnedAt]),
  );

  return BADGE_DEFINITIONS.map((badge) => ({
    code: badge.code,
    name: badge.name,
    description: badge.description,
    earned: awardedByCode.has(badge.code),
    earnedAt: awardedByCode.get(badge.code) ?? null,
  }));
}

export function uniqueDayKeys(dates: Date[]): string[] {
  return [...new Set(dates.map((date) => dayKey(date)))];
}
