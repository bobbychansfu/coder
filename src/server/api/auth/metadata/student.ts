import { prisma } from "@/lib/prisma";
import {
  SEVEN_DAYS_MS,
  type StudentStats,
  buildRankLabel,
  consecutiveDayStreak,
  denseRank,
  estimateStudyMinutes,
  participationBase,
  participationBonus,
} from "./shared";
import {
  awardBadges,
  getPersistedBadges,
  getRecentActivityDatesByUser,
  uniqueDayKeys,
} from "./persistence";

function eligibleBadgeCodes(stats: StudentStats): string[] {
  return [
    stats.totalSubmissions >= 1 ? "first-submission" : null,
    stats.problemsSolved >= 1 ? "first-accepted" : null,
    stats.logins7d >= 5 ? "active-learner" : null,
    stats.activeDays7d >= 7 ? "consistent-week" : null,
    stats.loginStreakDays >= 3 ? "login-streak-3" : null,
    stats.loginStreakDays >= 7 ? "login-streak-7" : null,
    stats.submissions7d >= 5 ? "submission-sprinter" : null,
    stats.submissions7d >= 20 ? "submission-marathon" : null,
    stats.problemsSolved >= 10 ? "problem-solver-10" : null,
    stats.problemsSolved >= 25 ? "problem-solver-25" : null,
    stats.problemsSolved >= 50 ? "problem-solver-50" : null,
    stats.contestsParticipated >= 5 ? "contest-regular" : null,
    stats.contestsParticipated >= 10 ? "contest-veteran" : null,
    stats.pointsAcquired >= 1000 ? "point-collector" : null,
    stats.pointsAcquired >= 2500 ? "elite-scorer" : null,
  ].filter((code): code is string => Boolean(code));
}

async function syncRankLabel(stats: StudentStats): Promise<void> {
  const currentUser = await prisma.user.findUnique({
    where: { id: stats.userId },
    select: { rank: true },
  });

  if (currentUser?.rank === stats.rankLabel) {
    return;
  }

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

export async function collectStudentStats(): Promise<StudentStats[]> {
  const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      computingId: true,
      firstName: true,
      lastName: true,
      rank: true,
      participations: {
        select: {
          contestId: true,
          role: true,
        },
      },
      submissions: {
        select: {
          contestId: true,
          createdAt: true,
          problemId: true,
          status: true,
          score: true,
        },
      },
    },
  });

  const userIds = students.map((student) => student.id);
  const [loginDatesByUser, syntheticSubmissionDatesByUser] = await Promise.all([
    getRecentActivityDatesByUser(userIds, "login"),
    getRecentActivityDatesByUser(userIds, "metadata_submission"),
  ]);

  return students.map((student) => {
    const loginDates = loginDatesByUser.get(student.id) ?? [];
    const syntheticSubmissionDates = syntheticSubmissionDatesByUser.get(student.id) ?? [];
    const solvedProblems = new Set<string>();
    const contestsParticipated = new Set(
      student.participations.filter((participation) => participation.role === "contestant").map((participation) => participation.contestId),
    );
    const bestScoreByContestProblem = new Map<string, number>();
    const submissionDays = new Set<string>();
    const contestsParticipated7d = new Set<string>();
    const solvedProblems7d = new Set<string>();
    const recentActivityDates = [...loginDates];
    let recentSubmissionsCount = 0;
    let points7d = 0;

    for (const submission of student.submissions) {
      const scoreKey = `${submission.contestId}:${submission.problemId}`;
      const priorBest = bestScoreByContestProblem.get(scoreKey) ?? 0;
      if (submission.score > priorBest) {
        bestScoreByContestProblem.set(scoreKey, submission.score);
      }

      if (submission.status === "ACCEPTED") {
        solvedProblems.add(submission.problemId);
      }

      if (submission.createdAt < threshold) {
        continue;
      }

      recentSubmissionsCount += 1;
      recentActivityDates.push(submission.createdAt);
      submissionDays.add(submission.createdAt.toISOString().slice(0, 10));
      contestsParticipated7d.add(submission.contestId);
      points7d += submission.score;
      if (submission.status === "ACCEPTED") {
        solvedProblems7d.add(submission.problemId);
      }
    }

    for (const date of syntheticSubmissionDates) {
      recentActivityDates.push(date);
      submissionDays.add(date.toISOString().slice(0, 10));
    }

    const loginDayKeys = uniqueDayKeys(loginDates);
    const activeDayKeys = new Set<string>([...loginDayKeys, ...submissionDays]);
    const totalPoints = [...bestScoreByContestProblem.values()].reduce((sum, score) => sum + score, 0);

    return {
      pointsAcquired: totalPoints,
      problemsSolved: solvedProblems.size,
      contestsParticipated: contestsParticipated.size,
      totalSubmissions: student.submissions.length,
      rankLabel: buildRankLabel(totalPoints),
      userId: student.id,
      computingId: student.computingId,
      firstName: student.firstName,
      lastName: student.lastName,
      problemsSolved7d: solvedProblems7d.size,
      contestsParticipated7d: contestsParticipated7d.size,
      points7d,
      submissions7d: recentSubmissionsCount + syntheticSubmissionDates.length,
      activeDays7d: activeDayKeys.size,
      logins7d: loginDates.length,
      loginStreakDays: consecutiveDayStreak(loginDayKeys),
      timeSpentMinutes7d: estimateStudyMinutes(recentActivityDates),
    };
  });
}

async function syncStudentProgress(stats: StudentStats): Promise<void> {
  await Promise.all([
    syncRankLabel(stats),
    awardBadges(stats.userId, eligibleBadgeCodes(stats)),
  ]);
}

export async function syncStudentGamification(computingId: string): Promise<StudentStats | null> {
  const allStudents = await collectStudentStats();
  const target = allStudents.find((student) => student.computingId === computingId);

  if (!target) {
    return null;
  }

  await syncStudentProgress(target);
  return target;
}

export async function buildStudentMetadataPayload(computingId: string) {
  const allStudents = await collectStudentStats();
  const target = allStudents.find((student) => student.computingId === computingId);

  if (!target) {
    return null;
  }

  await syncStudentProgress(target);
  const persistedBadges = await getPersistedBadges(target.userId);

  const pointsRanks = allStudents.map((student) => student.pointsAcquired).sort((a, b) => b - a);
  const participationRanks = allStudents
    .map((student) => participationBase(student) + participationBonus(student))
    .sort((a, b) => b - a);

  const base = participationBase(target);
  const bonus = participationBonus(target);
  const total = base + bonus;
  const rankPoints = denseRank(pointsRanks, target.pointsAcquired);
  const rankParticipation = denseRank(participationRanks, total);

  return {
    role: "student" as const,
    cards: {
      totalSolved: target.problemsSolved,
      participationContests: target.contestsParticipated,
      totalScore: target.pointsAcquired,
      rankNumber: rankPoints,
      rankPointsNumber: rankPoints,
      rankParticipationNumber: rankParticipation,
      currentRankLabel: target.rankLabel,
    },
    participation: {
      base,
      bonus,
      total,
      activity_7d: {
        logins_7d: target.logins7d,
        submissions_7d: target.submissions7d,
        login_streak_days: target.loginStreakDays,
      },
      active_days_7d: target.activeDays7d,
    },
    weekly: {
      problems_solved_7d: target.problemsSolved7d,
      contests_participated_7d: target.contestsParticipated7d,
      submissions_7d: target.submissions7d,
      points_7d: target.points7d,
      active_days_7d: target.activeDays7d,
      time_spent_minutes_7d: target.timeSpentMinutes7d,
    },
    ranks: {
      by_points: rankPoints,
      by_participation: rankParticipation,
      current_label: target.rankLabel,
    },
    badges: {
      earned: persistedBadges
        .filter((badge) => badge.earned)
        .sort((a, b) => {
          const left = a.earnedAt?.getTime() ?? 0;
          const right = b.earnedAt?.getTime() ?? 0;
          return right - left;
        }),
      all: persistedBadges,
    },
  };
}
