import { TRPCError } from "@trpc/server";
import type { User } from "@prisma/client";
import { router, studentProcedure } from "../init";
import type { StudentDashboardMetadataResponse } from "@/lib/trpc/types/dashboardMetadata";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
  if (dayKeys.length === 0) {
    return 0;
  }

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
  if (activityDates.length === 0) {
    return 0;
  }

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
    totalMinutes += 15;
    for (let index = 1; index < sorted.length; index += 1) {
      const gapMinutes = (sorted[index] - sorted[index - 1]) / 60000;
      totalMinutes += Math.max(0, Math.min(gapMinutes, 45));
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
    student.problemsSolved * 10 +
    student.contestsParticipated * 20 +
    student.pointsAcquired +
    student.logins7d +
    student.submissions7d * 8
  );
}

type StudentRecord = Pick<User, "id" | "computingId" | "pointsAcquired" | "problemsSolved" | "competitionsParticipated"> & {
  participations: { contestId: string }[];
  submissions: {
    contestId: string;
    problemId: string;
    createdAt: Date;
    score: number;
    status: string;
  }[];
  activities: { createdAt: Date }[];
  achievements: {
    earnedAt: Date;
    achievement: { name: string };
  }[];
};

function buildStudentPayload(
  student: StudentRecord,
  allStudents: StudentRecord[],
): StudentDashboardMetadataResponse {
  const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
  const recentSubmissions = student.submissions.filter((submission) => submission.createdAt >= threshold);
  const recentLogins = student.activities.map((activity) => activity.createdAt);
  const recentActivityDates = [...recentLogins, ...recentSubmissions.map((submission) => submission.createdAt)];
  const recentSolved = new Set(
    recentSubmissions
      .filter((submission) => submission.status === "ACCEPTED")
      .map((submission) => submission.problemId),
  );
  const recentContests = new Set(recentSubmissions.map((submission) => submission.contestId));
  const loginDayKeys = recentLogins.map(dayKey);
  const activeDayKeys = new Set([...loginDayKeys, ...recentSubmissions.map((submission) => dayKey(submission.createdAt))]);

  const studentScores = allStudents.map((candidate) => ({
    pointsAcquired: candidate.pointsAcquired,
    contestsParticipated:
      candidate.competitionsParticipated || new Set(candidate.participations.map((item) => item.contestId)).size,
    problemsSolved: candidate.problemsSolved,
    logins7d: candidate.activities.length,
    submissions7d: candidate.submissions.filter((submission) => submission.createdAt >= threshold).length,
  }));

  const pointRanks = studentScores.map((candidate) => candidate.pointsAcquired).sort((left, right) => right - left);
  const participationRanks = studentScores
    .map((candidate) => participationScore(candidate))
    .sort((left, right) => right - left);

  const earnedBadges = student.achievements
    .slice()
    .sort((left, right) => right.earnedAt.getTime() - left.earnedAt.getTime())
    .map((achievement) => ({
      code: slugifyBadgeName(achievement.achievement.name),
      name: achievement.achievement.name,
      earnedAt: achievement.earnedAt.toISOString(),
    }));

  const contestsParticipated =
    student.competitionsParticipated || new Set(student.participations.map((item) => item.contestId)).size;

  return {
    role: "student",
    cards: {
      totalSolved: student.problemsSolved,
      participationContests: contestsParticipated,
      totalScore: student.pointsAcquired,
      rankParticipationNumber: denseRank(
        participationRanks,
        participationScore({
          pointsAcquired: student.pointsAcquired,
          contestsParticipated,
          problemsSolved: student.problemsSolved,
          logins7d: recentLogins.length,
          submissions7d: recentSubmissions.length,
        }),
      ),
      rankPointsNumber: denseRank(pointRanks, student.pointsAcquired),
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
      earned: earnedBadges,
    },
  };
}

export const dashboardMetadataRouter = router({
  getStudent: studentProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "student") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const students = await ctx.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        computingId: true,
        pointsAcquired: true,
        problemsSolved: true,
        competitionsParticipated: true,
        participations: {
          where: { role: "contestant" },
          select: { contestId: true },
        },
        submissions: {
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
            createdAt: { gte: new Date(Date.now() - SEVEN_DAYS_MS) },
          },
          select: { createdAt: true },
        },
        achievements: {
          select: {
            earnedAt: true,
            achievement: { select: { name: true } },
          },
        },
      },
    });

    const student = students.find((candidate) => candidate.computingId === ctx.user.computingId);
    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
    }

    return buildStudentPayload(student, students);
  }),
});
