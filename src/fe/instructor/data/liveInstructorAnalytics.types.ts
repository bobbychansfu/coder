export interface ContestMetricRow {
  contest_id: string;
  contest_name: string;
  solve_rate: number;
  mean_solve_time_minutes: number | null;
  median_solve_time_minutes: number | null;
  attempts_to_solve: number | null;
}

export interface ProblemMetricRow {
  contest_id: string;
  contest_name: string;
  problem_id: string;
  problem_code: string;
  problem_title: string;
  time_to_first_submission_minutes: number | null;
  time_to_first_correct_submission_minutes: number | null;
  post_hint_solve_probability: number | null;
  attempts_before_hint: number | null;
  attempts_after_hint: number | null;
  time_to_solve_after_hint_minutes: number | null;
}

export type SegmentKey = "all" | "groupA" | "groupB" | "groupC";
export type ViewMode = "all" | "groupA" | "groupB" | "groupC";

export interface MetricBundle {
  contest_metrics: ContestMetricRow[];
  problem_metrics: ProblemMetricRow[];
}

export interface StudentCatalogRow {
  computingId: string;
  name: string;
  segment: "groupA" | "groupB" | "groupC";
}

export interface ContestCatalogRow {
  id: string;
  name: string;
  hintNote: string;
  gamificationNote: string;
  comparisonNote: string;
}

export interface InstructorAnalyticsUiPayload {
  segmented_metrics: Record<SegmentKey, MetricBundle>;
  student_views: Record<string, MetricBundle>;
  students_catalog: StudentCatalogRow[];
  contests_catalog: ContestCatalogRow[];
  analytics_notes: string[];
}
