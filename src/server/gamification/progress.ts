import { prisma } from "@/lib/prisma";
import {
  SEVEN_DAYS_MS,
  buildRankLabel,
  consecutiveDayStreak,
  dayKey,
  type StudentProgressStats,
} from "./shared";

export async function loadStudentProgress(computingId: string): Promise<StudentProgressStats | null> {
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
