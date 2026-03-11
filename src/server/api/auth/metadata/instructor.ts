import { prisma } from "@/lib/prisma";
import { computeContestAndProblemMetrics } from "./analytics";
import { collectStudentStats } from "./student";
import { inferSegment, participationBase, participationBonus, type SegmentKey, type SegmentedMetricBundle } from "./shared";

export async function buildInstructorMetadataPayload(role: "instructor" | "admin") {
  const [usersCount, students, studentStats, contests] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        computingId: true,
        firstName: true,
        lastName: true,
      },
    }),
    collectStudentStats(),
    prisma.contest.findMany({
      select: {
        id: true,
        name: true,
        startsAt: true,
        contestProblems: {
          select: {
            problem: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
        submissions: {
          select: {
            problemId: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                role: true,
                computingId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalStudents = studentStats.length;
  const avgSolved = totalStudents === 0 ? 0 : studentStats.reduce((sum, student) => sum + student.problemsSolved, 0) / totalStudents;
  const avgPoints = totalStudents === 0 ? 0 : studentStats.reduce((sum, student) => sum + student.pointsAcquired, 0) / totalStudents;
  const allStudentIds = new Set(students.map((student) => student.computingId));
  const groupAIds = new Set(students.filter((student) => inferSegment(student.computingId) === "groupA").map((student) => student.computingId));
  const groupBIds = new Set(students.filter((student) => inferSegment(student.computingId) === "groupB").map((student) => student.computingId));
  const studentNames = new Map(students.map((student) => [student.computingId, `${student.firstName} ${student.lastName}`]));

  const segmentedMetrics: Record<SegmentKey, SegmentedMetricBundle> = {
    all: computeContestAndProblemMetrics({ contests, includeComputingId: (computingId) => allStudentIds.has(computingId) }),
    groupA: computeContestAndProblemMetrics({ contests, includeComputingId: (computingId) => groupAIds.has(computingId) }),
    groupB: computeContestAndProblemMetrics({ contests, includeComputingId: (computingId) => groupBIds.has(computingId) }),
  };

  return {
    role,
    overview: {
      total_users: usersCount,
      total_students: totalStudents,
      avg_solved: avgSolved,
      avg_points: avgPoints,
      active_students_7d: studentStats.filter((student) => student.submissions7d > 0 || student.logins7d > 0).length,
    },
    submissions: {
      submissions_7d: studentStats.reduce((sum, student) => sum + student.submissions7d, 0),
      submitters_7d: studentStats.filter((student) => student.submissions7d > 0).length,
      trend_7d: [],
    },
    topStudents: [...studentStats]
      .sort((left, right) => {
        const leftScore = participationBase(left) + participationBonus(left);
        const rightScore = participationBase(right) + participationBonus(right);
        return rightScore - leftScore || right.pointsAcquired - left.pointsAcquired;
      })
      .slice(0, 10)
      .map((student) => ({
        computing_id: student.computingId,
        nickname: studentNames.get(student.computingId) ?? student.computingId,
        problems_solved: student.problemsSolved,
        points_acquired: student.pointsAcquired,
        competitions_participated: student.contestsParticipated,
        logins_7d: student.logins7d,
        submissions_7d: student.submissions7d,
        participation_score: participationBase(student) + participationBonus(student),
      })),
    contest_metrics: segmentedMetrics.all.contest_metrics,
    problem_metrics: segmentedMetrics.all.problem_metrics,
    segmented_metrics: segmentedMetrics,
    student_views: Object.fromEntries(
      students.map((student) => [
        student.computingId,
        computeContestAndProblemMetrics({
          contests,
          includeComputingId: (computingId) => computingId === student.computingId,
        }),
      ]),
    ),
    students_catalog: students.map((student) => ({
      computingId: student.computingId,
      name: `${student.firstName} ${student.lastName}`,
      segment: inferSegment(student.computingId),
    })),
    analytics_notes: [
      "Login events are persisted through UserActivity records.",
      "Badge awards are persisted through Achievement and UserAchievement records.",
      "Hint metrics currently use a heuristic: hint is considered after the 2nd attempt.",
    ],
  };
}
