import type { ContestListItem } from "@/fe/contests/data/contests";
import type { BackendContestSummary } from "@/fe/contests/services/contestApi";
import type { ContestStatus } from "@/fe/shared/types/contest";
import { getEffectiveContestStatus } from "@/lib/contestStatus";

function toTimestamp(value?: string | null) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

function compareNumericAscending(left: number, right: number) {
  const leftValid = Number.isFinite(left);
  const rightValid = Number.isFinite(right);

  if (leftValid && rightValid) {
    return left - right;
  }

  if (leftValid) {
    return -1;
  }

  if (rightValid) {
    return 1;
  }

  return 0;
}

function compareNumericDescending(left: number, right: number) {
  return compareNumericAscending(right, left);
}

function compareStrings(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function getCompletedTimestamp(contest: { startsAt?: string | null; endsAt?: string | null }) {
  const endTime = toTimestamp(contest.endsAt);

  if (Number.isFinite(endTime)) {
    return endTime;
  }

  return toTimestamp(contest.startsAt);
}

function getStatusPriority(status: ContestStatus) {
  switch (status) {
    case "In Progress":
      return 0;
    case "Upcoming":
      return 1;
    case "Closed":
      return 2;
  }
}

function compareContestMetadata(
  left: {
    title: string;
    status: ContestStatus;
    startsAt?: string | null;
    endsAt?: string | null;
  },
  right: {
    title: string;
    status: ContestStatus;
    startsAt?: string | null;
    endsAt?: string | null;
  },
) {
  const statusPriority = getStatusPriority(left.status) - getStatusPriority(right.status);

  if (statusPriority !== 0) {
    return statusPriority;
  }

  if (left.status === "In Progress" && right.status === "In Progress") {
    const remainingOrder = compareNumericAscending(
      toTimestamp(left.endsAt),
      toTimestamp(right.endsAt),
    );

    if (remainingOrder !== 0) {
      return remainingOrder;
    }

    const startOrder = compareNumericAscending(
      toTimestamp(left.startsAt),
      toTimestamp(right.startsAt),
    );

    if (startOrder !== 0) {
      return startOrder;
    }
  }

  if (left.status === "Upcoming" && right.status === "Upcoming") {
    const startOrder = compareNumericAscending(
      toTimestamp(left.startsAt),
      toTimestamp(right.startsAt),
    );

    if (startOrder !== 0) {
      return startOrder;
    }
  }

  if (left.status === "Closed" && right.status === "Closed") {
    const completedOrder = compareNumericDescending(
      getCompletedTimestamp(left),
      getCompletedTimestamp(right),
    );

    if (completedOrder !== 0) {
      return completedOrder;
    }
  }

  return compareStrings(left.title, right.title);
}

function mapBackendContestStatus(status: BackendContestSummary["status"]): ContestStatus {
  switch (status) {
    case "ACTIVE":
      return "In Progress";
    case "ENDED":
      return "Closed";
    default:
      return "Upcoming";
  }
}

export function compareContestListItems(left: ContestListItem, right: ContestListItem) {
  return compareContestMetadata(left, right);
}

export function sortContestListItems(contests: ContestListItem[]) {
  return contests.slice().sort(compareContestListItems);
}

export function compareBackendContestSummaries(
  left: BackendContestSummary,
  right: BackendContestSummary,
) {
  return compareContestMetadata(
    {
      title: left.name,
      status: mapBackendContestStatus(getEffectiveContestStatus(left)),
      startsAt: left.startsAt,
      endsAt: left.endsAt,
    },
    {
      title: right.name,
      status: mapBackendContestStatus(getEffectiveContestStatus(right)),
      startsAt: right.startsAt,
      endsAt: right.endsAt,
    },
  );
}

export function sortBackendContestSummaries(contests: BackendContestSummary[]) {
  return contests.slice().sort(compareBackendContestSummaries);
}
