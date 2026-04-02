import type {
  ContestAlert as DashboardContestAlert,
  ContestStatus,
  UpcomingContest,
} from "@/fe/shared/types/contest";
import type { BackendContestSummary, StudentContestInfoResponse } from "@/fe/contests/services/contestApi";

export interface DashboardContestHistoryItem {
  id: string;
  title: string;
  date: string;
  participants: number;
  status: ContestStatus;
}

export interface StudentDashboardContestSummary {
  upcomingContests: UpcomingContest[];
  recentContests: DashboardContestHistoryItem[];
  alert: (DashboardContestAlert & { contestId: string }) | null;
}

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

function formatContestDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeUntil(contest: BackendContestSummary) {
  const now = Date.now();
  const startsAt = toTimestamp(contest.startsAt);
  const endsAt = contest.endsAt ? toTimestamp(contest.endsAt) : null;

  if (contest.status === "ACTIVE") {
    if (endsAt && endsAt > now) {
      return `Ends in ${formatDuration(endsAt - now)}`;
    }

    return "Available now";
  }

  if (!Number.isFinite(startsAt) || startsAt <= now) {
    return "Opening soon";
  }

  return `Starts in ${formatDuration(startsAt - now)}`;
}

function formatDuration(diffMs: number) {
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.max(1, Math.round(diffMs / day));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function mapContestStatus(status: BackendContestSummary["status"]): ContestStatus {
  switch (status) {
    case "ACTIVE":
      return "In Progress";
    case "ENDED":
      return "Closed";
    default:
      return "Upcoming";
  }
}

function dedupeContests(contests: BackendContestSummary[]) {
  const seen = new Set<string>();

  return contests.filter((contest) => {
    if (seen.has(contest.id)) {
      return false;
    }

    seen.add(contest.id);
    return true;
  });
}

function sortByStartAscending(left: BackendContestSummary, right: BackendContestSummary) {
  return toTimestamp(left.startsAt) - toTimestamp(right.startsAt);
}

function sortByStartDescending(left: BackendContestSummary, right: BackendContestSummary) {
  return toTimestamp(right.startsAt) - toTimestamp(left.startsAt);
}

export function mapStudentDashboardContests(
  payload: StudentContestInfoResponse,
): StudentDashboardContestSummary {
  const visibleContests = dedupeContests([...payload.contests, ...payload.contestsOpen]).sort(
    sortByStartAscending,
  );
  const myContests = payload.contests.slice().sort(sortByStartDescending);

  const upcomingContests = visibleContests
    .filter((contest) => contest.status === "UPCOMING" || contest.status === "ACTIVE")
    .slice(0, 3)
    .map((contest) => ({
      id: contest.id,
      title: contest.name,
      date: formatContestDate(contest.startsAt),
      timeUntil: formatTimeUntil(contest),
      readinessState: contest.status === "ACTIVE" ? "Ready" : undefined,
    })) satisfies UpcomingContest[];

  const recentContests = myContests.slice(0, 3).map((contest) => ({
    id: contest.id,
    title: contest.name,
    date: formatContestDate(contest.startsAt),
    participants: contest.participants,
    status: mapContestStatus(contest.status),
  }));

  const highlightedContest =
    visibleContests.find((contest) => contest.status === "ACTIVE") ?? null;

  return {
    upcomingContests,
    recentContests,
    alert: highlightedContest
      ? {
          contestId: highlightedContest.id,
          title: "Contest in Progress!",
          description: `${highlightedContest.name} is currently active.`,
          isActive: true,
        }
      : null,
  };
}



