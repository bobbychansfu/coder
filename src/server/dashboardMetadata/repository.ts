import { prisma } from "@/lib/prisma";
import { SEVEN_DAYS_MS } from "@/server/gamification/shared";

type PrismaClient = typeof prisma;

export interface DashboardMetadataSnapshot {
  currentStudent: {
    id: string;
    computingId: string;
    pointsAcquired: number;
    problemsSolved: number;
    competitionsParticipated: number;
    submissions: Array<{
      contestId: string;
      problemId: string;
      createdAt: Date;
      score: number;
      status: string;
    }>;
    activities: Array<{ createdAt: Date }>;
    achievements: Array<{
      earnedAt: Date;
      achievement: {
        code: string | null;
        name: string;
      };
    }>;
  };
  rankingStudents: Array<{
    id: string;
    pointsAcquired: number;
    problemsSolved: number;
    competitionsParticipated: number;
  }>;
  loginCountByUser: Map<string, number>;
  submissionCountByUser: Map<string, number>;
  participationCountByUser: Map<string, number>;
}

export async function loadDashboardMetadataSnapshot(
  client: PrismaClient,
  computingId: string,
): Promise<DashboardMetadataSnapshot | null> {
  const threshold = new Date(Date.now() - SEVEN_DAYS_MS);
  const currentStudent = await client.user.findUnique({
    where: { computingId },
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
    return null;
  }

  const rankingStudents = await client.user.findMany({
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
    client.userActivity.groupBy({
      by: ["userId"],
      where: {
        userId: { in: studentIds },
        type: "login",
        createdAt: { gte: threshold },
      },
      _count: { _all: true },
    }),
    client.submission.groupBy({
      by: ["userId"],
      where: {
        userId: { in: studentIds },
        createdAt: { gte: threshold },
      },
      _count: { _all: true },
    }),
    client.participation.groupBy({
      by: ["userId"],
      where: {
        userId: { in: studentIds },
        role: "contestant",
      },
      _count: { _all: true },
    }),
  ]);

  return {
    currentStudent,
    rankingStudents,
    loginCountByUser: new Map(loginGroups.map((group) => [group.userId, group._count._all])),
    submissionCountByUser: new Map(
      submissionGroups.map((group) => [group.userId, group._count._all]),
    ),
    participationCountByUser: new Map(
      participationGroups.map((group) => [group.userId, group._count._all]),
    ),
  };
}
