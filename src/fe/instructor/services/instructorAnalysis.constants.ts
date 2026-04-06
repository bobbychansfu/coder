import type { InstructorAnalysisData } from "@/lib/types/instructorAnalysis";

export const INSTRUCTOR_ANALYSIS_STALE_TIME_MS = 30_000;
export const EMPTY_PROBLEM_OPTION_VALUE = "__no_problem__";

export const EMPTY_INSTRUCTOR_ANALYSIS_DATA: InstructorAnalysisData = {
  filters: {
    contests: [],
    problems: [],
    snapshotPreferences: [
      { value: "latest", label: "Latest Available" },
      { value: "preliminary", label: "Preliminary (+5m)" },
      { value: "final", label: "Final (+15m)" },
    ],
  },
  selection: {
    contestId: null,
    problemId: null,
    snapshotPreference: "latest",
  },
  contest: {
    id: null,
    title: null,
    dateLabel: "No contest selected",
    statusLabel: "No snapshot available yet",
  },
  snapshot: {
    requestedPreference: "latest",
    requestedPreferenceLabel: "Latest available",
    resolvedType: null,
    resolvedTypeLabel: "No snapshot available yet",
    status: "NOT_READY",
    statusLabel: "Waiting",
    watermarkLabel: "Watermark not scheduled",
    computedAtLabel: "Not computed yet",
    message: "Choose an instructor contest to inspect post-contest matrices.",
  },
  contestGroupMetrics: [],
  problemStudentMetrics: [],
};
