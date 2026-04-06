export type SnapshotPreference = "latest" | "preliminary" | "final";
export type SnapshotType = "PRELIMINARY_5M" | "FINAL_15M";
export type SnapshotRunStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED" | "NOT_READY";

export interface InstructorAnalysisFilterOption {
  value: string;
  label: string;
}

export interface InstructorAnalysisContestGroupMetric {
  groupName: "A" | "B" | "C";
  solveRate: number;
  meanSolveTimeSec: number | null;
  medianSolveTimeSec: number | null;
  attemptsToSolveMean: number | null;
}

export interface InstructorAnalysisProblemStudentMetric {
  studentId: string;
  studentName: string;
  groupName: "A" | "B" | "C" | null;
  timeToFirstSubmissionSec: number | null;
  timeToFirstCorrectSec: number | null;
  postHintSolveProbability: number | null;
  attemptsBeforeHint: number | null;
  attemptsAfterHint: number | null;
  timeToSolveAfterHintSec: number | null;
}

export interface InstructorAnalysisResponse {
  role: "instructor";
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
    startsAt: string | null;
    endsAt: string | null;
    status: "Draft" | "Upcoming" | "Active" | "Ended" | null;
  };
  snapshot: {
    requestedPreference: SnapshotPreference;
    resolvedType: SnapshotType | null;
    status: SnapshotRunStatus;
    watermark: string | null;
    computedAt: string | null;
    message: string;
  };
  contestGroupMetrics: {
    rows: InstructorAnalysisContestGroupMetric[];
  };
  problemStudentMetrics: {
    rows: InstructorAnalysisProblemStudentMetric[];
  };
}
