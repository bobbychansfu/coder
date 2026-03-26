import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PsychologyAltOutlinedIcon from "@mui/icons-material/PsychologyAltOutlined";
import type { InstructorDashboardData } from "@/lib/types/instructorDashboard";
import type { InstructorDashboardResponse } from "@/lib/trpc/types/instructorDashboard";

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "-";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes || 1} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} d`;
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
      return `${Math.round(diffMinutes / 60)} hours left`;
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
    return `${Math.round(diffMinutes / 60)} hours`;
  }
  return `${Math.round(diffMinutes / 1440)} days`;
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

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} days ago`;
}

export function mapInstructorDashboardResponse(
  payload: InstructorDashboardResponse,
): InstructorDashboardData {
  const scheduleStatusCounts = payload.schedule.upcoming.reduce(
    (acc, contest) => {
      if (contest.status === "Active") {
        acc.active += 1;
      } else if (contest.status === "Upcoming") {
        acc.upcoming += 1;
      }
      return acc;
    },
    { active: 0, upcoming: 0 },
  );

  return {
    statistics: [
      {
        title: "Contests Held",
        value: String(payload.metadata.contestsHeld),
        subtitle: `${scheduleStatusCounts.active} active · ${scheduleStatusCounts.upcoming} upcoming`,
        icon: EmojiEventsOutlinedIcon,
        variant: "neutral",
      },
      {
        title: "Problems Authored",
        value: String(payload.metadata.problemsAuthored),
        subtitle: "Across instructor contest sets",
        icon: FactCheckOutlinedIcon,
        variant: "neutral",
        tone: "highlight",
      },
      {
        title: "Students Reached",
        value: String(payload.metadata.studentsReached),
        subtitle: "Across instructor-created contests",
        icon: GroupAddOutlinedIcon,
        variant: "neutral",
        tone: "info",
      },
      {
        title: "Last Metrics Sync",
        value: formatRelativeTime(payload.metadata.metricsUpdatedAt),
        subtitle: "Latest dashboard snapshot",
        icon: PsychologyAltOutlinedIcon,
        variant: "success",
      },
    ],
    schedule: payload.schedule.upcoming.map((contest) => ({
      id: contest.id,
      title: contest.title,
      date: formatShortDate(contest.startsAt),
      timeUntil: formatScheduleTimeUntil(contest.startsAt, contest.endsAt, contest.status),
      status: contest.status,
      readinessState: contest.readinessState,
    })),
    contests: payload.contests.owned.map((contest) => ({
      id: contest.id,
      title: contest.title,
      date: formatShortDate(contest.startsAt),
      status: contest.status,
      participants: contest.participants,
      problemsCount: contest.problemsCount,
      groupsAssignedCount: contest.groupsAssignedCount,
      aiHintEnabled: contest.aiHintEnabled,
    })),
    announcements: payload.announcements.recent.map((item) => ({
      ...item,
      timestamp: formatActivityTimestamp(item.timestamp),
    })),
    snapshots: payload.snapshots.items.map((snapshot) => ({
      id: snapshot.id,
      label: snapshot.label,
      value: snapshot.value,
      caption: snapshot.caption,
    })),
  };
}
