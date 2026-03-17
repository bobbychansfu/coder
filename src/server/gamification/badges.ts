import { prisma } from "@/lib/prisma";
import { ensureBadgeCatalog } from "./catalog";

export async function awardMissingBadges(userId: string, eligibleCodes: string[]): Promise<void> {
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
