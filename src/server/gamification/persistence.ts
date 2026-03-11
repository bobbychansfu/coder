import { prisma } from "@/lib/prisma";
import {
  BADGE_DEFINITIONS,
  SEVEN_DAYS_MS,
  buildRankLabel,
  consecutiveDayStreak,
  dayKey,
  eligibleBadgeCodes,
  type StudentProgressStats,
} from "./shared";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function ensureBadgeCatalog(): Promise<Map<string, string>> {
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

  return new Map(
    achievements
      .filter((achievement) => achievement.code)
      .map((achievement) => [achievement.code as string, achievement.id]),
  );
}

async function awardMissingBadges(userId: string, eligibleCodes: string[]): Promise<void> {
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

async function loadStudentProgress(computingId: string): Promise<StudentProgressStats | null> {
  const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
  const student = await prisma.user.findUnique({
    where: { computingId },
    select: {
      id: true,
      computingId: true,
      pointsAcquired: true,
      problemsSolved: true,
      competitionsParticipated: true,
      _count: { select: { submissions: true } },
      participations: {
        where: { role: "contestant" },
        select: { contestId: true },
      },
      submissions: {
        where: { createdAt: { gte: threshold } },
        select: { createdAt: true },
      },
      activities: {
        where: {
          type: "login",
          createdAt: { gte: threshold },
        },
        select: { createdAt: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  const loginDates = student.activities.map((activity) => activity.createdAt);
  const submissionDates = student.submissions.map((submission) => submission.createdAt);
  const activeDayKeys = new Set([...loginDates.map(dayKey), ...submissionDates.map(dayKey)]);
  const contestsParticipated =
    student.competitionsParticipated ||
    new Set(student.participations.map((participation) => participation.contestId)).size;

  return {
    userId: student.id,
    computingId: student.computingId,
    pointsAcquired: student.pointsAcquired,
    problemsSolved: student.problemsSolved,
    contestsParticipated,
    totalSubmissions: student._count.submissions,
    submissions7d: student.submissions.length,
    logins7d: loginDates.length,
    activeDays7d: activeDayKeys.size,
    loginStreakDays: consecutiveDayStreak(loginDates.map(dayKey)),
    rankLabel: buildRankLabel(student.pointsAcquired),
  };
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

    await prisma.userActivity.create({
      data: {
        userId: stats.userId,
        type: "rank_up",
        name: `Achieved the rank of ${stats.rankLabel}`,
      },
    });
  }

  await awardMissingBadges(stats.userId, eligibleBadgeCodes(stats));
}
