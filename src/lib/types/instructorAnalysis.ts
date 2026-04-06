import type {
  SnapshotPreference,
  SnapshotRunStatus,
  SnapshotType,
} from "@/lib/trpc/types/instructorAnalysis";

export interface InstructorAnalysisFilterOption {
  value: string;
  label: string;
}

export interface InstructorAnalysisContestGroupMetricRow {
  groupLabel: string;
  solveRate: string;
  meanSolveTime: string;
  medianSolveTime: string;
  attemptsToSolve: string;
}

export interface InstructorAnalysisProblemStudentMetricRow {
  studentId: string;
  studentName: string;
  groupLabel: string;
  timeToFirstSubmission: string;
  timeToFirstCorrect: string;
  postHintSolveProbability: string;
  attemptsBeforeHint: string;
  attemptsAfterHint: string;
  timeToSolveAfterHint: string;
}

export interface InstructorAnalysisData {
  filters: {
    contests: InstructorAnalysisFilterOption[];
    problems: InstructorAnalysisFilterOption[];
    snapshotPreferences: Array<{
      value: SnapshotPreference;
      label: string;
    }>;
  };
  selection: {
    contestId: string | null;
    problemId: string | null;
    snapshotPreference: SnapshotPreference;
  };
  contest: {
    id: string | null;
    title: string | null;
    dateLabel: string;
    statusLabel: string;
  };
  snapshot: {
    requestedPreference: SnapshotPreference;
    requestedPreferenceLabel: string;
    resolvedType: SnapshotType | null;
    resolvedTypeLabel: string;
    status: SnapshotRunStatus;
    statusLabel: string;
    watermarkLabel: string;
    computedAtLabel: string;
    message: string;
  };
  contestGroupMetrics: InstructorAnalysisContestGroupMetricRow[];
  problemStudentMetrics: InstructorAnalysisProblemStudentMetricRow[];
}
