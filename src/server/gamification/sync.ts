import { prisma } from "@/lib/prisma";
import { createRankUpActivity } from "./activity";
import { awardMissingBadges } from "./badges";
import { loadStudentProgress } from "./progress";
import { eligibleBadgeCodes } from "./shared";

export async function syncStudentGamification(computingId: string): Promise<void> {
  const stats = await loadStudentProgress(computingId);
  if (!stats) {
    return;
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: stats.userId },
    select: { rank: true },
  });

  if (currentUser?.rank !== stats.rankLabel) {
    await prisma.user.update({
      where: { id: stats.userId },
      data: { rank: stats.rankLabel },
    });

    await createRankUpActivity(stats.userId, stats.rankLabel);
  }

  await awardMissingBadges(stats.userId, eligibleBadgeCodes(stats));
}
