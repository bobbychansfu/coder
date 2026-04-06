type ContestStatusValue = "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";

interface ContestStatusInput {
  status: ContestStatusValue;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  durationMinutes?: number | null;
}

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return Number.NaN;
  }

  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function resolveContestEndTimestamp(contest: ContestStatusInput) {
  const explicitEnd = toTimestamp(contest.endsAt);

  if (Number.isFinite(explicitEnd)) {
    return explicitEnd;
  }

  if (typeof contest.durationMinutes === "number" && contest.durationMinutes > 0) {
    const start = toTimestamp(contest.startsAt);

    if (Number.isFinite(start)) {
      return start + contest.durationMinutes * 60_000;
    }
  }

  return Number.NaN;
}

export function getEffectiveContestStatus(contest: ContestStatusInput): ContestStatusValue {
  if (contest.status === "DRAFT") {
    return "DRAFT";
  }

  const start = toTimestamp(contest.startsAt);

  if (!Number.isFinite(start)) {
    return contest.status;
  }

  const end = resolveContestEndTimestamp(contest);
  const now = Date.now();

  if (start > now) {
    return "UPCOMING";
  }

  if (Number.isFinite(end) && end <= now) {
    return "ENDED";
  }

  return "ACTIVE";
}

export function isJoinableContestStatus(status: ContestStatusValue) {
  return status === "UPCOMING" || status === "ACTIVE";
}
