import type {
  InstructorAnalysisContestGroupMetricRow,
  InstructorAnalysisData,
  InstructorAnalysisProblemStudentMetricRow,
} from "@/lib/types/instructorAnalysis";
import type {
  InstructorAnalysisResponse,
  SnapshotPreference,
  SnapshotRunStatus,
  SnapshotType,
} from "@/lib/trpc/types/instructorAnalysis";

function formatPercent(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "-";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return "-";
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)} min`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)} hr`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function buildContestDateLabel(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) {
    return "Schedule unavailable";
  }

  const startLabel = formatDateTime(startsAt);
  if (!endsAt) {
    return `Starts ${startLabel}`;
  }

  return `Starts ${startLabel} · Ends ${formatDateTime(endsAt)}`;
}

function buildSnapshotStatusLabel(
  status: SnapshotRunStatus,
  resolvedType: SnapshotType | null,
): string {
  if (status === "NOT_READY") {
    return "Waiting for snapshot window";
  }

  if (status === "FAILED") {
    return "Snapshot failed";
  }

  if (status === "RUNNING") {
    return "Snapshot computing";
  }

  if (status === "QUEUED") {
    return "Snapshot queued";
  }

  if (resolvedType === "FINAL_15M") {
    return "Final snapshot";
  }

  if (resolvedType === "PRELIMINARY_5M") {
    return "Preliminary snapshot";
  }

  return "Snapshot ready";
}

function buildSnapshotPreferenceLabel(value: SnapshotPreference): string {
  if (value === "preliminary") {
    return "Preliminary (+5m)";
  }

  if (value === "final") {
    return "Final (+15m)";
  }

  return "Latest available";
}

function buildResolvedSnapshotLabel(value: SnapshotType | null): string {
  if (value === "PRELIMINARY_5M") {
    return "Preliminary (+5m)";
  }

  if (value === "FINAL_15M") {
    return "Final (+15m)";
  }

  return "No snapshot available yet";
}

function mapContestGroupRow(
  row: InstructorAnalysisResponse["contestGroupMetrics"]["rows"][number],
): InstructorAnalysisContestGroupMetricRow {
  return {
    groupLabel: `Group ${row.groupName}`,
    solveRate: formatPercent(row.solveRate),
    meanSolveTime: formatDuration(row.meanSolveTimeSec),
    medianSolveTime: formatDuration(row.medianSolveTimeSec),
    attemptsToSolve: formatNumber(row.attemptsToSolveMean),
  };
}

function mapProblemStudentRow(
  row: InstructorAnalysisResponse["problemStudentMetrics"]["rows"][number],
): InstructorAnalysisProblemStudentMetricRow {
  return {
    studentId: row.studentId,
    studentName: row.studentName,
    groupLabel: row.groupName ? `Group ${row.groupName}` : "-",
    timeToFirstSubmission: formatDuration(row.timeToFirstSubmissionSec),
    timeToFirstCorrect: formatDuration(row.timeToFirstCorrectSec),
    postHintSolveProbability: formatPercent(row.postHintSolveProbability),
    attemptsBeforeHint: formatNumber(row.attemptsBeforeHint),
    attemptsAfterHint: formatNumber(row.attemptsAfterHint),
    timeToSolveAfterHint: formatDuration(row.timeToSolveAfterHintSec),
  };
}

export function mapInstructorAnalysisResponse(
  payload: InstructorAnalysisResponse,
): InstructorAnalysisData {
  return {
    filters: payload.filters,
    selection: payload.selection,
    contest: {
      id: payload.contest.id,
      title: payload.contest.title,
      dateLabel: buildContestDateLabel(payload.contest.startsAt, payload.contest.endsAt),
      statusLabel: payload.contest.status ?? "No contest selected",
    },
    snapshot: {
      requestedPreference: payload.snapshot.requestedPreference,
      requestedPreferenceLabel: buildSnapshotPreferenceLabel(
        payload.snapshot.requestedPreference,
      ),
      resolvedType: payload.snapshot.resolvedType,
      resolvedTypeLabel: buildResolvedSnapshotLabel(payload.snapshot.resolvedType),
      status: payload.snapshot.status,
      statusLabel: buildSnapshotStatusLabel(
        payload.snapshot.status,
        payload.snapshot.resolvedType,
      ),
      watermarkLabel: payload.snapshot.watermark
        ? `Watermark ${formatDateTime(payload.snapshot.watermark)}`
        : "Watermark not available yet",
      computedAtLabel: payload.snapshot.computedAt
        ? `Computed ${formatDateTime(payload.snapshot.computedAt)}`
        : "Not computed yet",
      message: payload.snapshot.message,
    },
    contestGroupMetrics: payload.contestGroupMetrics.rows.map(mapContestGroupRow),
    problemStudentMetrics: payload.problemStudentMetrics.rows.map(mapProblemStudentRow),
  };
}
