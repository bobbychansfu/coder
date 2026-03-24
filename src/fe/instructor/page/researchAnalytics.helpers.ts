import type {
  ContestMetricRow,
  InstructorAnalyticsUiPayload,
  ProblemMetricRow,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import type {
  FilterOption,
  GroupComparisonMetricRow,
  TrendDataset,
} from "@/fe/instructor/data/researchAnalytics";

type ComparisonMetricKind = "percent" | "minutes" | "decimal";

export interface ContestComparisonFilters {
  leftContest: string;
  rightContest: string;
}

export interface GroupComparisonFilters {
  leftContest: string;
  leftGroup: string;
  rightContest: string;
  rightGroup: string;
}

export interface StudentComparisonFilters {
  leftContest: string;
  leftGroup: string;
  leftStudent: string;
  rightContest: string;
  rightGroup: string;
  rightStudent: string;
}

export const EXPORT_SECTION_LABELS = {
  contestData: "Contest Data",
  problemData: "Problem Data",
  contestComparison: "Contest Comparison",
  groupComparison: "Group Comparison",
  studentComparison: "Student Comparison",
  gamificationStatistics: "Gamification Statistics",
  aiHintStatistics: "AI Hint Statistics",
} as const;

export type ExportSectionKey = keyof typeof EXPORT_SECTION_LABELS;
export type ExportFormat = "json" | "csv" | "pdf";

export function toggleSectionSelection(
  current: Record<ExportSectionKey, boolean>,
  section: ExportSectionKey,
): Record<ExportSectionKey, boolean> {
  return {
    ...current,
    [section]: !current[section],
  };
}

export function toggleAllSectionSelections(
  nextValue: boolean,
): Record<ExportSectionKey, boolean> {
  return (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).reduce<
    Record<ExportSectionKey, boolean>
  >((acc, key) => {
    acc[key] = nextValue;
    return acc;
  }, {} as Record<ExportSectionKey, boolean>);
}

export function average(values: Array<number | null | undefined>): number {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}%`;
}

function formatMetricValue(value: number, kind: ComparisonMetricKind): string {
  if (kind === "percent") return `${Math.round(value)}%`;
  if (kind === "minutes") return `${Math.round(value)}m`;
  return value.toFixed(1);
}

export function buildComparisonRow(
  label: string,
  left: number,
  right: number,
  kind: ComparisonMetricKind,
): GroupComparisonMetricRow {
  const max = Math.max(left, right, 1);

  return {
    label,
    leftValue: formatMetricValue(left, kind),
    rightValue: formatMetricValue(right, kind),
    leftPercent: Math.round((left / max) * 100),
    rightPercent: Math.round((right / max) * 100),
  };
}

export function buildProblemComparisonRows(
  leftProblems: ProblemMetricRow[],
  rightProblems: ProblemMetricRow[],
): GroupComparisonMetricRow[] {
  return [
    buildComparisonRow(
      "First Submission",
      average(leftProblems.map((row) => row.time_to_first_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "First Correct",
      average(leftProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "Post-Hint Solve",
      average(leftProblems.map((row) => row.post_hint_solve_probability)),
      average(rightProblems.map((row) => row.post_hint_solve_probability)),
      "percent",
    ),
    buildComparisonRow(
      "Attempts Before Hint",
      average(leftProblems.map((row) => row.attempts_before_hint)),
      average(rightProblems.map((row) => row.attempts_before_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Attempts After Hint",
      average(leftProblems.map((row) => row.attempts_after_hint)),
      average(rightProblems.map((row) => row.attempts_after_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Solve Time After Hint",
      average(leftProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      average(rightProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      "minutes",
    ),
  ];
}

export function buildContestComparisonRows(
  contestRows: ContestMetricRow[],
  filters: ContestComparisonFilters,
): GroupComparisonMetricRow[] {
  const leftContest = contestRows.find((row) => row.contest_id === filters.leftContest);
  const rightContest = contestRows.find((row) => row.contest_id === filters.rightContest);

  if (!leftContest || !rightContest) return [];

  return [
    buildComparisonRow("Solve Rate", leftContest.solve_rate, rightContest.solve_rate, "percent"),
    buildComparisonRow(
      "Mean Solve Time",
      leftContest.mean_solve_time_minutes ?? 0,
      rightContest.mean_solve_time_minutes ?? 0,
      "minutes",
    ),
    buildComparisonRow(
      "Median Solve Time",
      leftContest.median_solve_time_minutes ?? 0,
      rightContest.median_solve_time_minutes ?? 0,
      "minutes",
    ),
    buildComparisonRow(
      "Attempts to Solve",
      leftContest.attempts_to_solve ?? 0,
      rightContest.attempts_to_solve ?? 0,
      "decimal",
    ),
  ];
}

function toSegmentKey(value: string): "groupA" | "groupB" | "groupC" {
  if (value === "group-a") return "groupA";
  if (value === "group-b") return "groupB";
  return "groupC";
}

export function getDefaultStudentIdForGroup(
  analytics: InstructorAnalyticsUiPayload,
  groupValue: string,
  fallback: string,
): string {
  return (
    analytics.students_catalog.find((student) => student.segment === toSegmentKey(groupValue))
      ?.computingId ?? fallback
  );
}

export function buildGroupComparisonRows(
  analytics: InstructorAnalyticsUiPayload,
  filters: GroupComparisonFilters,
): GroupComparisonMetricRow[] {
  const leftProblems =
    analytics.segmented_metrics[toSegmentKey(filters.leftGroup)].problem_metrics.filter(
      (row) => row.contest_id === filters.leftContest,
    );
  const rightProblems =
    analytics.segmented_metrics[toSegmentKey(filters.rightGroup)].problem_metrics.filter(
      (row) => row.contest_id === filters.rightContest,
    );

  return buildProblemComparisonRows(leftProblems, rightProblems);
}

export function buildStudentOptions(
  analytics: InstructorAnalyticsUiPayload,
  groupValue: string,
): FilterOption[] {
  const selectedGroup = toSegmentKey(groupValue);

  return analytics.students_catalog
    .filter((student) => student.segment === selectedGroup)
    .map((student) => ({
      label: student.name,
      value: student.computingId,
    }));
}

export function buildStudentComparisonRows(
  analytics: InstructorAnalyticsUiPayload,
  filters: StudentComparisonFilters,
): GroupComparisonMetricRow[] {
  const leftStudent = analytics.student_views[filters.leftStudent];
  const rightStudent = analytics.student_views[filters.rightStudent];

  const leftContest = leftStudent?.contest_metrics.find(
    (row) => row.contest_id === filters.leftContest,
  );
  const rightContest = rightStudent?.contest_metrics.find(
    (row) => row.contest_id === filters.rightContest,
  );
  const leftProblems =
    leftStudent?.problem_metrics.filter((row) => row.contest_id === filters.leftContest) ?? [];
  const rightProblems =
    rightStudent?.problem_metrics.filter((row) => row.contest_id === filters.rightContest) ?? [];

  return [
    buildComparisonRow("Solve Rate", leftContest?.solve_rate ?? 0, rightContest?.solve_rate ?? 0, "percent"),
    buildComparisonRow(
      "Mean Solve Time",
      leftContest?.mean_solve_time_minutes ?? 0,
      rightContest?.mean_solve_time_minutes ?? 0,
      "minutes",
    ),
    buildComparisonRow(
      "Median Solve Time",
      leftContest?.median_solve_time_minutes ?? 0,
      rightContest?.median_solve_time_minutes ?? 0,
      "minutes",
    ),
    buildComparisonRow(
      "Attempts to Solve",
      leftContest?.attempts_to_solve ?? 0,
      rightContest?.attempts_to_solve ?? 0,
      "decimal",
    ),
    buildComparisonRow(
      "First Submission",
      average(leftProblems.map((row) => row.time_to_first_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "First Correct",
      average(leftProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "Post-Hint Solve",
      average(leftProblems.map((row) => row.post_hint_solve_probability)),
      average(rightProblems.map((row) => row.post_hint_solve_probability)),
      "percent",
    ),
    buildComparisonRow(
      "Attempts Before Hint",
      average(leftProblems.map((row) => row.attempts_before_hint)),
      average(rightProblems.map((row) => row.attempts_before_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Attempts After Hint",
      average(leftProblems.map((row) => row.attempts_after_hint)),
      average(rightProblems.map((row) => row.attempts_after_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Solve Time After Hint",
      average(leftProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      average(rightProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      "minutes",
    ),
  ];
}

export function getOptionLabel(
  options: FilterOption[],
  value: string,
  fallback: string,
): string {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

export function buildCsvSection(title: string, rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return `${title}\nNo data\n`;
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const body = rows
    .map((row) =>
      headers
        .map((header) => {
          const raw = row[header];
          const text =
            raw == null
              ? ""
              : typeof raw === "object"
                ? JSON.stringify(raw)
                : String(raw);
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  return `${title}\n${headerLine}\n${body}\n`;
}

export function buildExportSections(params: {
  contestRows: Array<Record<string, unknown>>;
  problemRows: Array<Record<string, unknown>>;
  contestComparisonRows: GroupComparisonMetricRow[];
  groupComparisonRows: GroupComparisonMetricRow[];
  studentComparisonRows: GroupComparisonMetricRow[];
  leftContestLabel: string;
  rightContestLabel: string;
  leftGroupComparisonContestLabel: string;
  rightGroupComparisonContestLabel: string;
  leftGroupLabel: string;
  rightGroupLabel: string;
  leftStudentContestLabel: string;
  rightStudentContestLabel: string;
  leftStudentLabel: string;
  rightStudentLabel: string;
  leftStudentGroup: string;
  rightStudentGroup: string;
  gamificationTrend: TrendDataset;
  aiHintTrend: TrendDataset;
}) {
  return {
    contestData: params.contestRows,
    problemData: params.problemRows,
    contestComparison: params.contestComparisonRows.map((row) => ({
      metric: row.label,
      leftContest: params.leftContestLabel,
      leftValue: row.leftValue,
      rightContest: params.rightContestLabel,
      rightValue: row.rightValue,
    })),
    groupComparison: params.groupComparisonRows.map((row) => ({
      metric: row.label,
      leftContest: params.leftGroupComparisonContestLabel,
      leftGroup: params.leftGroupLabel,
      leftValue: row.leftValue,
      rightContest: params.rightGroupComparisonContestLabel,
      rightGroup: params.rightGroupLabel,
      rightValue: row.rightValue,
    })),
    studentComparison: params.studentComparisonRows.map((row) => ({
      metric: row.label,
      leftContest: params.leftStudentContestLabel,
      leftGroup: params.leftStudentGroup,
      leftStudent: params.leftStudentLabel,
      leftValue: row.leftValue,
      rightContest: params.rightStudentContestLabel,
      rightGroup: params.rightStudentGroup,
      rightStudent: params.rightStudentLabel,
      rightValue: row.rightValue,
    })),
    gamificationStatistics: params.gamificationTrend.xLabels.map((label, index) => ({
      contest: label,
      participationRate: `${params.gamificationTrend.series[0]?.data[index] ?? 0}%`,
      completionRate: `${params.gamificationTrend.series[1]?.data[index] ?? 0}%`,
      repeatAttempts: `${params.gamificationTrend.series[2]?.data[index] ?? 0}%`,
    })),
    aiHintStatistics: params.aiHintTrend.xLabels.map((label, index) => ({
      contest: label,
      hintUsageRate: `${params.aiHintTrend.series[0]?.data[index] ?? 0}%`,
      postHintSolveRate: `${params.aiHintTrend.series[1]?.data[index] ?? 0}%`,
      attemptsAfterHint: `${params.aiHintTrend.series[2]?.data[index] ?? 0}%`,
    })),
  } as const;
}
