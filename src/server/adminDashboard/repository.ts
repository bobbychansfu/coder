import { prisma } from "@/lib/prisma";
import { getEffectiveContestStatus } from "@/lib/contestStatus";
import {
  NON_INSTRUCTOR_DASHBOARD_ROLES,
  normalizeAdminDashboardRole,
  type AdminDashboardRole,
} from "./roleCompatibility";

type PrismaClient = typeof prisma;
const ADMIN_DASHBOARD_CONTEST_LIMIT = 12;

export interface AdminDashboardSnapshot {
  admin: {
    id: string;
    computingId: string;
  };
  roleCounts: {
    students: number;
    instructors: number;
    admins: number;
  };
  problemBankSize: number;
  contestCounts: {
    total: number;
    active: number;
    upcoming: number;
    published: number;
    draftUnpublished: number;
  };
  submissionsLast24Hours: number;
  submissionsPrevious24Hours: number;
  pendingSubmissions: number;
  acceptedSubmissionsLast24Hours: number;
  failureSubmissionsLast24Hours: number;
  newUsersLast7Days: number;
  newStudentsLast7Days: number;
  newInstructorsLast7Days: number;
  newAdminsLast7Days: number;
  contests: Array<{
    id: string;
    name: string;
    classSection: string | null;
    status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";
    visibility: "PUBLIC" | "PRIVATE" | "COURSE_ONLY";
    startsAt: Date;
    endsAt: Date | null;
    durationMinutes: number | null;
    participants: number;
    published: boolean;
    updatedAt: Date;
    instructor: {
      firstName: string;
      lastName: string;
    } | null;
    _count: {
      contestProblems: number;
      announcements: number;
    };
  }>;
  recentAnnouncements: Array<{
    id: string;
    title: string;
    scope: "PLATFORM" | "CONTEST";
    createdAt: Date;
    contestName: string | null;
    author: {
      firstName: string;
      lastName: string;
      role: AdminDashboardRole;
    } | null;
  }>;
  recentUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: AdminDashboardRole;
    createdAt: Date;
  }>;
}

export async function loadAdminDashboardSnapshot(
  client: PrismaClient,
  computingId: string,
): Promise<AdminDashboardSnapshot | null> {
  const admin = await client.user.findUnique({
    where: { computingId },
    select: {
      id: true,
      computingId: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    return null;
  }

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    students,
    instructors,
    admins,
    problemBankSize,
    totalContests,
    contestStatusRecords,
    publishedContestsCount,
    draftUnpublishedContestsCount,
    submissionsLast24Hours,
    submissionsPrevious24Hours,
    pendingSubmissions,
    acceptedSubmissionsLast24Hours,
    failureSubmissionsLast24Hours,
    newUsersLast7Days,
    newStudentsLast7Days,
    newInstructorsLast7Days,
    newAdminsLast7Days,
    contests,
    recentAnnouncements,
    recentUsers,
  ] = await Promise.all([
    client.user.count({ where: { role: "STUDENT" } }),
    client.user.count({
      where: {
        role: { notIn: [...NON_INSTRUCTOR_DASHBOARD_ROLES] },
      },
    }),
    client.user.count({ where: { role: "ADMIN" } }),
    client.problem.count(),
    client.contest.count(),
    client.contest.findMany({
      select: {
        status: true,
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
      },
    }),
    client.contest.count({ where: { published: true } }),
    client.contest.count({
      where: {
        status: "DRAFT",
        published: false,
      },
    }),
    client.submission.count({
      where: {
        createdAt: { gte: last24Hours },
      },
    }),
    client.submission.count({
      where: {
        createdAt: {
          gte: last48Hours,
          lt: last24Hours,
        },
      },
    }),
    client.submission.count({
      where: {
        status: "PENDING",
      },
    }),
    client.submission.count({
      where: {
        createdAt: { gte: last24Hours },
        status: "ACCEPTED",
      },
    }),
    client.submission.count({
      where: {
        createdAt: { gte: last24Hours },
        status: {
          in: ["COMPILE_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED", "WRONG_ANSWER"],
        },
      },
    }),
    client.user.count({
      where: {
        createdAt: { gte: last7Days },
      },
    }),
    client.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: last7Days },
      },
    }),
    client.user.count({
      where: {
        role: { notIn: [...NON_INSTRUCTOR_DASHBOARD_ROLES] },
        createdAt: { gte: last7Days },
      },
    }),
    client.user.count({
      where: {
        role: "ADMIN",
        createdAt: { gte: last7Days },
      },
    }),
    client.contest.findMany({
      take: ADMIN_DASHBOARD_CONTEST_LIMIT,
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        classSection: true,
        status: true,
        visibility: true,
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
        participants: true,
        published: true,
        updatedAt: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            contestProblems: true,
            announcements: true,
          },
        },
      },
    }),
    client.announcement.findMany({
      take: 6,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        scope: true,
        createdAt: true,
        contest: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    client.user.findMany({
      take: 6,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const activeContestsCount = contestStatusRecords.filter(
    (contest) => getEffectiveContestStatus(contest) === "ACTIVE",
  ).length;
  const upcomingContestsCount = contestStatusRecords.filter(
    (contest) => getEffectiveContestStatus(contest) === "UPCOMING",
  ).length;

  return {
    admin: {
      id: admin.id,
      computingId: admin.computingId,
    },
    roleCounts: {
      students,
      instructors,
      admins,
    },
    problemBankSize,
    contestCounts: {
      total: totalContests,
      active: activeContestsCount,
      upcoming: upcomingContestsCount,
      published: publishedContestsCount,
      draftUnpublished: draftUnpublishedContestsCount,
    },
    submissionsLast24Hours,
    submissionsPrevious24Hours,
    pendingSubmissions,
    acceptedSubmissionsLast24Hours,
    failureSubmissionsLast24Hours,
    newUsersLast7Days,
    newStudentsLast7Days,
    newInstructorsLast7Days,
    newAdminsLast7Days,
    contests,
    recentAnnouncements: recentAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      scope: announcement.scope,
      createdAt: announcement.createdAt,
      contestName: announcement.contest?.name ?? null,
      author: announcement.author
        ? {
            firstName: announcement.author.firstName,
            lastName: announcement.author.lastName,
            role: normalizeAdminDashboardRole(announcement.author.role),
          }
        : null,
    })),
    recentUsers: recentUsers.map((user) => ({
      ...user,
      role: normalizeAdminDashboardRole(user.role),
    })),
  };
}
