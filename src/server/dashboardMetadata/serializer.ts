import type { StudentDashboardMetadataResponse } from "@/lib/trpc/types/dashboardMetadata";
import { consecutiveDayStreak, dayKey } from "@/server/gamification/shared";
import { denseRank, estimateStudyMinutes, participationScore } from "./metrics";
import type { DashboardMetadataSnapshot } from "./repository";

function slugifyBadgeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function buildStudentDashboardMetadataResponse(
  snapshot: DashboardMetadataSnapshot,
): StudentDashboardMetadataResponse {
  const pointRanks = snapshot.rankingStudents
    .map((student) => student.pointsAcquired)
    .sort((left, right) => right - left);

  const participationRanks = snapshot.rankingStudents
    .map((student) => {
      const contestsParticipated = Math.max(
        student.competitionsParticipated,
        snapshot.participationCountByUser.get(student.id) ?? 0,
      );

      return participationScore({
        pointsAcquired: student.pointsAcquired,
        contestsParticipated,
        problemsSolved: student.problemsSolved,
        logins7d: snapshot.loginCountByUser.get(student.id) ?? 0,
        submissions7d: snapshot.submissionCountByUser.get(student.id) ?? 0,
      });
    })
    .sort((left, right) => right - left);

  const recentLogins = snapshot.currentStudent.activities.map((activity) => activity.createdAt);
  const recentSubmissions = snapshot.currentStudent.submissions;
  const recentActivityDates = [
    ...recentLogins,
    ...recentSubmissions.map((submission) => submission.createdAt),
  ];
  const recentSolved = new Set(
    recentSubmissions
      .filter((submission) => submission.status === "ACCEPTED")
      .map((submission) => submission.problemId),
  );
  const recentContests = new Set(recentSubmissions.map((submission) => submission.contestId));
  const loginDayKeys = recentLogins.map(dayKey);
  const activeDayKeys = new Set([
    ...loginDayKeys,
    ...recentSubmissions.map((submission) => dayKey(submission.createdAt)),
  ]);
  const contestsParticipated = Math.max(
    snapshot.currentStudent.competitionsParticipated,
    snapshot.participationCountByUser.get(snapshot.currentStudent.id) ?? 0,
  );

  return {
    role: "student",
    cards: {
      totalSolved: snapshot.currentStudent.problemsSolved,
      participationContests: contestsParticipated,
      totalScore: snapshot.currentStudent.pointsAcquired,
      rankParticipationNumber: denseRank(
        participationRanks,
        participationScore({
          pointsAcquired: snapshot.currentStudent.pointsAcquired,
          contestsParticipated,
          problemsSolved: snapshot.currentStudent.problemsSolved,
          logins7d: recentLogins.length,
          submissions7d: recentSubmissions.length,
        }),
      ),
      rankPointsNumber: denseRank(pointRanks, snapshot.currentStudent.pointsAcquired),
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
      earned: snapshot.currentStudent.achievements
        .slice()
        .sort((left, right) => right.earnedAt.getTime() - left.earnedAt.getTime())
        .map((achievement) => ({
          code: achievement.achievement.code ?? slugifyBadgeName(achievement.achievement.name),
          name: achievement.achievement.name,
          earnedAt: achievement.earnedAt.toISOString(),
        })),
    },
  };
}
