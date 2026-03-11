import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";
import type { StudentDashboardMetadataResponse } from "@/lib/trpc/types/dashboardMetadata";
import { SEVEN_DAYS_MS } from "@/server/gamification/shared";

const MINIMUM_SESSION_MINUTES = 15;
const MAXIMUM_GAP_MINUTES = 45;
const SOLVED_WEIGHT = 10;
const CONTEST_WEIGHT = 20;
const SUBMISSION_WEIGHT = 8;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function denseRank(values: number[], target: number): number | null {
  let rank = 0;
  let previous: number | null = null;
  for (const value of values) {
    if (previous === null || previous !== value) {
      rank += 1;
      previous = value;
    }
    if (value === target) {
      return rank;
    }
  }
  return null;
}

function consecutiveDayStreak(dayKeys: string[]): number {
  if (dayKeys.length === 0) return 0;

  const uniqueDays = [...new Set(dayKeys)].sort();
  let best = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const prev = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);
    const next = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function estimateStudyMinutes(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;

  const byDay = new Map<string, number[]>();
  for (const date of activityDates) {
    const key = dayKey(date);
    const entries = byDay.get(key) ?? [];
    entries.push(date.getTime());
    byDay.set(key, entries);
  }

  let totalMinutes = 0;
  for (const timestamps of byDay.values()) {
    const sorted = [...timestamps].sort((left, right) => left - right);
    totalMinutes += MINIMUM_SESSION_MINUTES;
    for (let index = 1; index < sorted.length; index += 1) {
      const gapMinutes = (sorted[index] - sorted[index - 1]) / 60000;
      totalMinutes += Math.max(0, Math.min(gapMinutes, MAXIMUM_GAP_MINUTES));
    }
  }

  return Math.round(totalMinutes);
}

function slugifyBadgeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function participationScore(student: {
  problemsSolved: number;
  contestsParticipated: number;
  pointsAcquired: number;
  logins7d: number;
  submissions7d: number;
}): number {
  return (
    student.problemsSolved * SOLVED_WEIGHT +
    student.contestsParticipated * CONTEST_WEIGHT +
    student.pointsAcquired +
    student.logins7d +
    student.submissions7d * SUBMISSION_WEIGHT
  );
}

export const dashboardMetadataRouter = router({
  getStudent: studentProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "student") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
    const currentStudent = await ctx.prisma.user.findUnique({
      where: { computingId: ctx.user.computingId },
      select: {
        id: true,
        computingId: true,
        pointsAcquired: true,
        problemsSolved: true,
        competitionsParticipated: true,
        submissions: {
          where: { createdAt: { gte: threshold } },
          select: {
            contestId: true,
            problemId: true,
            createdAt: true,
            score: true,
            status: true,
          },
        },
        activities: {
          where: {
            type: "login",
            createdAt: { gte: threshold },
          },
          select: { createdAt: true },
        },
        achievements: {
          select: {
            earnedAt: true,
            achievement: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!currentStudent) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
    }

    const rankingStudents = await ctx.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        pointsAcquired: true,
        problemsSolved: true,
        competitionsParticipated: true,
      },
    });

    const studentIds = rankingStudents.map((student) => student.id);
    const [loginGroups, submissionGroups, participationGroups] = await Promise.all([
      ctx.prisma.userActivity.groupBy({
        by: ["userId"],
        where: {
          userId: { in: studentIds },
          type: "login",
          createdAt: { gte: threshold },
        },
        _count: { _all: true },
      }),
      ctx.prisma.submission.groupBy({
        by: ["userId"],
        where: {
          userId: { in: studentIds },
          createdAt: { gte: threshold },
        },
        _count: { _all: true },
      }),
      ctx.prisma.participation.groupBy({
        by: ["userId"],
        where: {
          userId: { in: studentIds },
          role: "contestant",
        },
        _count: { _all: true },
      }),
    ]);

    const loginCountByUser = new Map(loginGroups.map((group) => [group.userId, group._count._all]));
    const submissionCountByUser = new Map(
      submissionGroups.map((group) => [group.userId, group._count._all]),
    );
    const participationCountByUser = new Map(
      participationGroups.map((group) => [group.userId, group._count._all]),
    );

    const pointRanks = rankingStudents
      .map((student) => student.pointsAcquired)
      .sort((left, right) => right - left);
    const participationRanks = rankingStudents
      .map((student) => {
        const contestsParticipated = Math.max(
          student.competitionsParticipated,
          participationCountByUser.get(student.id) ?? 0,
        );

        return (
        participationScore({
          pointsAcquired: student.pointsAcquired,
          contestsParticipated,
          problemsSolved: student.problemsSolved,
          logins7d: loginCountByUser.get(student.id) ?? 0,
          submissions7d: submissionCountByUser.get(student.id) ?? 0,
        })
        );
      })
      .sort((left, right) => right - left);

    const recentLogins = currentStudent.activities.map((activity) => activity.createdAt);
    const recentSubmissions = currentStudent.submissions;
    const recentActivityDates = [
      ...recentLogins,
      ...recentSubmissions.map((submission) => submission.createdAt),
    ];
    const recentSolved = new Set(
      recentSubmissions
        .filter((submission) => submission.status === "ACCEPTED")
        .map((submission) => submission.problemId),
    );
    const recentContests = new Set(
      recentSubmissions.map((submission) => submission.contestId),
    );
    const loginDayKeys = recentLogins.map(dayKey);
    const activeDayKeys = new Set([
      ...loginDayKeys,
      ...recentSubmissions.map((submission) => dayKey(submission.createdAt)),
    ]);
    const contestsParticipated = Math.max(
      currentStudent.competitionsParticipated,
      participationCountByUser.get(currentStudent.id) ?? 0,
    );

    return {
      role: "student",
      cards: {
        totalSolved: currentStudent.problemsSolved,
        participationContests: contestsParticipated,
        totalScore: currentStudent.pointsAcquired,
        rankParticipationNumber: denseRank(
          participationRanks,
          participationScore({
            pointsAcquired: currentStudent.pointsAcquired,
            contestsParticipated,
            problemsSolved: currentStudent.problemsSolved,
            logins7d: recentLogins.length,
            submissions7d: recentSubmissions.length,
          }),
        ),
        rankPointsNumber: denseRank(pointRanks, currentStudent.pointsAcquired),
      },
      participation: {
        activeDays7d: activeDayKeys.size,
        submissions7d: recentSubmissions.length,
        loginStreakDays: consecutiveDayStreak(loginDayKeys),
      },
      weekly: {
        problemsSolved7d: recentSolved.size,
        contestsParticipated7d: recentContests.size,
        points7d: recentSubmissions.reduce((sum, submission) => sum + submission.score, 0),
        timeSpentMinutes7d: estimateStudyMinutes(recentActivityDates),
      },
      badges: {
        earned: currentStudent.achievements
          .slice()
          .sort((left, right) => right.earnedAt.getTime() - left.earnedAt.getTime())
          .map((achievement) => ({
            code: achievement.achievement.code ?? slugifyBadgeName(achievement.achievement.name),
            name: achievement.achievement.name,
            earnedAt: achievement.earnedAt.toISOString(),
          })),
      },
    } satisfies StudentDashboardMetadataResponse;
  }),
});
