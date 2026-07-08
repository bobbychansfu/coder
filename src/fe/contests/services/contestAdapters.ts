import type { ContestStatus } from "@/fe/shared/types/contest";
import type { ContestDetail, ContestDetailStatus, ContestProblem } from "@/fe/contests/data/contestDetails";
import type { ContestListItem } from "@/fe/contests/data/contests";
import type {
  BackendContestScoreboardRow,
  BackendContestProblemStatus,
  BackendContestSummary,
  ContestProblemStatusResponse,
  StudentContestInfoResponse,
} from "./contestApi";
import { getEffectiveContestStatus } from "@/lib/contestStatus";

function mapContestListStatus(contest: BackendContestSummary): ContestStatus {
  switch (getEffectiveContestStatus(contest)) {
    case "ACTIVE":
      return "In Progress";
    case "ENDED":
      return "Closed";
    default:
      return "Upcoming";
  }
}

function mapContestDetailStatus(contest: BackendContestSummary): ContestDetailStatus {
  switch (getEffectiveContestStatus(contest)) {
    case "ACTIVE":
      return "in progress";
    case "ENDED":
      return "closed";
    default:
      return "upcoming";
  }
}

function mapDifficulty(value: string | null | undefined): ContestProblem["difficulty"] {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }

  return "medium";
}

function formatContestStartTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getDurationMinutes(contest: BackendContestSummary) {
  if (typeof contest.durationMinutes === "number" && contest.durationMinutes > 0) {
    return contest.durationMinutes;
  }

  if (!contest.endsAt) {
    return 0;
  }

  const startTime = new Date(contest.startsAt).getTime();
  const endTime = new Date(contest.endsAt).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return 0;
  }

  return Math.round((endTime - startTime) / 60000);
}

function toProblemCode(ordering: number) {
  let value = Math.max(0, ordering);
  let code = "";

  do {
    code = String.fromCharCode(65 + (value % 26)) + code;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return code;
}

function isSolved(row: BackendContestProblemStatus) {
  return row.problem.problemStatuses.some((status) => {
    const normalizedStatus = status.status.trim().toLowerCase();
    return normalizedStatus === "correct" || status.score > 0;
  });
}

function toContestProblem(row: BackendContestProblemStatus, index: number): ContestProblem {
  return {
    problemId: row.problemId,
    code: toProblemCode(index),
    title: row.problem.title,
    practiceProblemCode: row.problem.code,
    difficulty: mapDifficulty(row.problem.difficulty),
    tags: [],
    points: row.problem.points ?? 0,
    solved: isSolved(row),
  };
}

function toScoreboardRow(row: BackendContestScoreboardRow) {
  return {
    rank: row.rank,
    name: row.name,
    solved: row.solved,
    score: row.score,
    problems: row.problems,
    isCurrentUser: row.isCurrentUser,
  };
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

export function getContestSummaries(payload: StudentContestInfoResponse) {
  return dedupeContests([...payload.contests, ...payload.contestsOpen]);
}

export function toContestListItem(contest: BackendContestSummary): ContestListItem {
  return {
    id: contest.id,
    title: contest.name,
    status: mapContestListStatus(contest),
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    durationMinutes: getDurationMinutes(contest),
  };
}

export function toContestDetail(
  contest: BackendContestSummary,
  liveDetail?: ContestProblemStatusResponse | null,
): ContestDetail {
  const problems = (liveDetail?.contestProblemsStatus ?? [])
    .slice()
    .sort((left, right) => left.ordering - right.ordering)
    .map((row, index) => toContestProblem(row, index));

  return {
    id: contest.id,
    title: contest.name,
    status: mapContestDetailStatus(contest),
    startTime: formatContestStartTime(contest.startsAt),
    startTimeISO: contest.startsAt,
    durationMinutes: getDurationMinutes(contest),
    problemsCount: problems.length,
    participantsLabel: `${contest.participants} registered`,
    problems,
    scoreboard: (liveDetail?.scoreboard ?? []).map(toScoreboardRow),
    clarifications: [],
  };
}
