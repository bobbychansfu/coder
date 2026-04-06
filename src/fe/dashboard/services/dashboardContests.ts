import type {
  ContestAlert as DashboardContestAlert,
  ContestStatus,
  UpcomingContest,
} from "@/fe/shared/types/contest";
import type { BackendContestSummary, StudentContestInfoResponse } from "@/fe/contests/services/contestApi";
import { sortBackendContestSummaries } from "@/fe/contests/services/contestOrdering";
import { getEffectiveContestStatus } from "@/lib/contestStatus";

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
  alert: (DashboardContestAlert & { contestId: string; requiresRegistration: boolean }) | null;
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
  const effectiveStatus = getEffectiveContestStatus(contest);

  if (effectiveStatus === "ACTIVE") {
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

function mapContestStatus(contest: BackendContestSummary): ContestStatus {
  switch (getEffectiveContestStatus(contest)) {
    case "ACTIVE":
      return "In Progress";
    case "ENDED":
      return "Closed";
    default:
      return "Upcoming";
  }
}

function buildHighlightedContestDescription(contest: BackendContestSummary) {
  const endsAt = contest.endsAt ? toTimestamp(contest.endsAt) : null;

  if (endsAt === null || !Number.isFinite(endsAt)) {
    return `${contest.name} is in progress right now.`;
  }

  const remaining = endsAt - Date.now();

  if (remaining <= 0) {
    return `${contest.name} is in progress right now.`;
  }

  if (remaining <= 60 * 60_000) {
    return `${contest.name} is almost done.`;
  }

  return `${contest.name} ends in ${formatDuration(remaining)}.`;
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

export function mapStudentDashboardContests(
  payload: StudentContestInfoResponse,
): StudentDashboardContestSummary {
  const registeredContestIds = new Set(payload.contests.map((contest) => contest.id));
  const visibleContests = sortBackendContestSummaries(
    dedupeContests([...payload.contests, ...payload.contestsOpen]),
  );
  const myContests = sortBackendContestSummaries(payload.contests);

  const upcomingContests = visibleContests
    .filter((contest) => {
      const effectiveStatus = getEffectiveContestStatus(contest);
      return effectiveStatus === "UPCOMING" || effectiveStatus === "ACTIVE";
    })
    .slice(0, 3)
    .map((contest) => ({
      id: contest.id,
      title: contest.name,
      date: formatContestDate(contest.startsAt),
      timeUntil: formatTimeUntil(contest),
      readinessState: getEffectiveContestStatus(contest) === "ACTIVE" ? "Ready" : undefined,
    })) satisfies UpcomingContest[];

  const recentContests = myContests.slice(0, 3).map((contest) => ({
    id: contest.id,
    title: contest.name,
    date: formatContestDate(contest.startsAt),
    participants: contest.participants,
    status: mapContestStatus(contest),
  }));

  const highlightedContest =
    visibleContests.find((contest) => getEffectiveContestStatus(contest) === "ACTIVE") ?? null;

  return {
    upcomingContests,
    recentContests,
    alert: highlightedContest
      ? {
          contestId: highlightedContest.id,
          title: "Contest in Progress!",
          description: buildHighlightedContestDescription(highlightedContest),
          isActive: true,
          requiresRegistration: !registeredContestIds.has(highlightedContest.id),
        }
      : null,
  };
}
