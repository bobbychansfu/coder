import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { formatAdminRoleSummaryLines } from "@/lib/adminDashboard/roleSummary";
import type { AdminDashboardData } from "@/lib/types/adminDashboard";
import type { AdminDashboardResponse } from "@/lib/trpc/types/adminDashboard";

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "-";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes || 1} min`;
  }

  const diffHours = Math.max(1, Math.floor(diffMinutes / 60));
  if (diffHours < 24) {
    return `${diffHours} hr`;
  }

  return `${Math.max(1, Math.floor(diffHours / 24))} d`;
}

function formatShortDate(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(timestamp);
}

function formatScheduleTimeUntil(
  startsAt: string,
  endsAt: string | null,
  status: "Draft" | "Upcoming" | "Active",
): string {
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : null;
  const now = Date.now();

  if (status === "Active") {
    if (end && !Number.isNaN(end)) {
      const diffMinutes = Math.max(0, Math.round((end - now) / 60000));
      if (diffMinutes < 60) {
        return `${diffMinutes || 1} min left`;
      }
      return `${Math.max(1, Math.floor(diffMinutes / 60))} hours left`;
    }
    return "Live now";
  }

  if (status === "Draft") {
    return "Draft";
  }

  if (Number.isNaN(start)) {
    return "Upcoming";
  }

  const diffMinutes = Math.max(0, Math.round((start - now) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes || 1} min`;
  }
  if (diffMinutes < 1440) {
    return `${Math.max(1, Math.floor(diffMinutes / 60))} hours`;
  }
  return `${Math.max(1, Math.floor(diffMinutes / 1440))} days`;
}

function formatActivityTimestamp(value: string | null): string {
  if (!value) {
    return "Recently";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Recently";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes || 1} minutes ago`;
  }

  const diffHours = Math.max(1, Math.floor(diffMinutes / 60));
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  return `${Math.max(1, Math.floor(diffHours / 24))} days ago`;
}

export function mapAdminDashboardResponse(payload: AdminDashboardResponse): AdminDashboardData {
  return {
    statistics: [
      {
        title: "Platform Users",
        value: String(payload.metadata.totalUsers),
        subtitle: formatAdminRoleSummaryLines(payload.metadata.roleCounts),
        icon: Groups2OutlinedIcon,
        variant: "neutral",
      },
      {
        title: "Contest Operations",
        value: String(payload.metadata.activeContests),
        subtitle: `${payload.metadata.upcomingContests} upcoming contests`,
        icon: ShieldOutlinedIcon,
        variant: "neutral",
        tone: "info",
      },
      {
        title: "Problem Bank",
        value: String(payload.metadata.problemBankSize),
        subtitle: "Platform-wide authored problems",
        icon: LibraryBooksOutlinedIcon,
        variant: "neutral",
        tone: "highlight",
      },
      {
        title: "Last Metrics Sync",
        value: formatRelativeTime(payload.metadata.metricsUpdatedAt),
        subtitle: `${payload.metadata.submissionsLast24Hours} submissions in the last 24h`,
        icon: QueryStatsOutlinedIcon,
        variant: "success",
      },
    ],
    schedule: payload.schedule.upcoming.map((contest) => ({
      id: contest.id,
      title: contest.title,
      courseCode: contest.classSection ?? contest.status,
      date: formatShortDate(contest.startsAt),
      timeUntil: formatScheduleTimeUntil(contest.startsAt, contest.endsAt, contest.status),
      readinessState: contest.readinessState,
    })),
    contests: payload.contests.overview.map((contest) => ({
      id: contest.id,
      title: contest.title,
      owner: contest.instructorName,
      date: formatShortDate(contest.startsAt),
      status: contest.status,
      visibility: contest.visibility,
      participants: contest.participants,
      problemsCount: contest.problemsCount,
      announcementsCount: contest.announcementsCount,
      published: contest.published,
    })),
    activity: payload.activity.recent.map((item) => ({
      ...item,
      timestamp: formatActivityTimestamp(item.timestamp),
    })),
    snapshots: payload.snapshots.items.map((item) => ({
      id: item.id,
      label: item.label,
      value: item.value,
      caption: item.caption,
    })),
  };
}
