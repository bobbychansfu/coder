import { formatAdminRoleSummaryLines } from "@/lib/adminDashboard/roleSummary";
import { getEffectiveContestStatus } from "@/lib/contestStatus";
import type { AdminDashboardResponse } from "@/lib/trpc/types/adminDashboard";
import type { AdminDashboardSnapshot } from "./repository";

function titleCaseContestStatus(
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED",
): "Draft" | "Upcoming" | "Active" | "Ended" {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UPCOMING":
      return "Upcoming";
    case "ACTIVE":
      return "Active";
    case "ENDED":
      return "Ended";
  }
}

function titleCaseUpcomingContestStatus(
  status: "DRAFT" | "UPCOMING" | "ACTIVE",
): "Draft" | "Upcoming" | "Active" {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UPCOMING":
      return "Upcoming";
    case "ACTIVE":
      return "Active";
  }
}

function titleCaseVisibility(
  visibility: "PUBLIC" | "PRIVATE" | "COURSE_ONLY",
): "Public" | "Private" | "Course Only" {
  switch (visibility) {
    case "PUBLIC":
      return "Public";
    case "PRIVATE":
      return "Private";
    case "COURSE_ONLY":
      return "Course Only";
  }
}

function titleCaseRole(
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT",
): "Admin" | "Instructor" | "Student" {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "INSTRUCTOR":
      return "Instructor";
    case "STUDENT":
      return "Student";
  }
}

function buildReadinessState(contest: AdminDashboardSnapshot["contests"][number]) {
  const checks = [
    contest.published,
    contest._count.contestProblems > 0,
    contest.instructor !== null,
    contest._count.announcements > 0,
  ];
  const missing = checks.filter((item) => !item).length;

  if (missing === 0) {
    return "Ready" as const;
  }

  if (missing >= 3) {
    return "Blocked" as const;
  }

  return "Needs Attention" as const;
}

function formatDeltaLabel(current: number, previous: number, noun: string): string {
  const delta = current - previous;
  if (delta === 0) {
    return `Stable vs earlier ${noun}`;
  }

  const direction = delta > 0 ? "+" : "";
  return `${direction}${delta} vs earlier ${noun}`;
}

export function buildAdminDashboardResponse(
  snapshot: AdminDashboardSnapshot,
): AdminDashboardResponse {
  const totalUsers =
    snapshot.roleCounts.students +
    snapshot.roleCounts.instructors +
    snapshot.roleCounts.admins;

  const activeContests = snapshot.contestCounts.active;
  const upcomingContests = snapshot.contestCounts.upcoming;
  const metricsUpdatedAt = new Date(
    Math.max(
      0,
      snapshot.contests.reduce((max, contest) => Math.max(max, contest.updatedAt.getTime()), 0),
      snapshot.recentAnnouncements.reduce(
        (max, announcement) => Math.max(max, announcement.createdAt.getTime()),
        0,
      ),
      snapshot.recentUsers.reduce((max, user) => Math.max(max, user.createdAt.getTime()), 0),
    ),
  );

  const activity = [
    ...snapshot.recentAnnouncements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      description: `${titleCaseRole(announcement.author?.role ?? "ADMIN")} ${
        announcement.author?.firstName ?? "System"
      } ${announcement.author?.lastName ?? ""} posted “${announcement.title}”${
        announcement.contestName ? ` for ${announcement.contestName}` : " to the platform"
      }`,
      timestamp: announcement.createdAt.toISOString(),
      tone: "warning" as const,
    })),
    ...snapshot.recentUsers.map((user) => ({
      id: `user-${user.id}`,
      description: `${titleCaseRole(user.role)} ${user.firstName} ${user.lastName} joined the platform`,
      timestamp: user.createdAt.toISOString(),
      tone: "success" as const,
    })),
    ...snapshot.contests.slice(0, 4).map((contest) => ({
      id: `contest-${contest.id}`,
      description: `${contest.name} was updated with ${contest._count.contestProblems} problems and ${contest._count.announcements} announcements`,
      timestamp: contest.updatedAt.toISOString(),
      tone: "info" as const,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 6);

  return {
    role: "admin",
    metadata: {
      totalUsers,
      activeContests,
      upcomingContests,
      problemBankSize: snapshot.problemBankSize,
      submissionsLast24Hours: snapshot.submissionsLast24Hours,
      pendingSubmissions: snapshot.pendingSubmissions,
      roleCounts: snapshot.roleCounts,
      metricsUpdatedAt:
        metricsUpdatedAt.getTime() > 0 ? metricsUpdatedAt.toISOString() : null,
    },
    schedule: {
      upcoming: snapshot.contests
        .filter((contest) => {
          if (contest.status === "DRAFT") {
            return true;
          }

          const effectiveStatus = getEffectiveContestStatus(contest);
          return effectiveStatus === "UPCOMING" || effectiveStatus === "ACTIVE";
        })
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
        .slice(0, 4)
        .map((contest) => {
          const displayStatus: "DRAFT" | "UPCOMING" | "ACTIVE" =
            contest.status === "DRAFT"
              ? "DRAFT"
              : getEffectiveContestStatus(contest) === "ACTIVE"
                ? "ACTIVE"
                : "UPCOMING";

          return {
            id: contest.id,
            title: contest.name,
            classSection: contest.classSection,
            startsAt: contest.startsAt.toISOString(),
            endsAt: contest.endsAt?.toISOString() ?? null,
            status: titleCaseUpcomingContestStatus(displayStatus),
            readinessState: buildReadinessState(contest),
          };
        }),
    },
    contests: {
      overview: snapshot.contests.slice(0, 5).map((contest) => ({
        id: contest.id,
        title: contest.name,
        instructorName: contest.instructor
          ? `${contest.instructor.firstName} ${contest.instructor.lastName}`
          : "Unassigned",
        startsAt: contest.startsAt.toISOString(),
        status: titleCaseContestStatus(
          contest.status === "DRAFT" ? "DRAFT" : getEffectiveContestStatus(contest),
        ),
        visibility: titleCaseVisibility(contest.visibility),
        participants: contest.participants,
        problemsCount: contest._count.contestProblems,
        announcementsCount: contest._count.announcements,
        published: contest.published,
      })),
    },
    activity: {
      recent: activity,
    },
    snapshots: {
      items: [
        {
          id: "pending-queue",
          label: "Pending Queue",
          value: String(snapshot.pendingSubmissions),
          caption: `${snapshot.failureSubmissionsLast24Hours} failed submissions in last 24h`,
        },
        {
          id: "new-accounts",
          label: "New Accounts (7d)",
          value: String(snapshot.newUsersLast7Days),
          caption: formatAdminRoleSummaryLines({
            students: snapshot.newStudentsLast7Days,
            instructors: snapshot.newInstructorsLast7Days,
            admins: snapshot.newAdminsLast7Days,
          }),
        },
        {
          id: "publication-coverage",
          label: "Publication Coverage",
          value:
            snapshot.contestCounts.total === 0
              ? "0/0"
              : `${snapshot.contestCounts.published}/${snapshot.contestCounts.total}`,
          caption:
            snapshot.contestCounts.draftUnpublished > 0
              ? `${snapshot.contestCounts.draftUnpublished} draft contests still unpublished`
              : formatDeltaLabel(activeContests, upcomingContests, "contest mix"),
        },
        {
          id: "submission-flow",
          label: "Submission Flow",
          value: String(snapshot.submissionsLast24Hours),
          caption: formatDeltaLabel(
            snapshot.submissionsLast24Hours,
            snapshot.submissionsPrevious24Hours,
            "submission pace",
          ),
        },
      ],
    },
  };
}
