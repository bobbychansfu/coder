export const PRACTICE_SUBMISSION_STATUSES = ["queued", "running", "done", "failed"] as const;

export type PracticeSubmissionStatus = (typeof PRACTICE_SUBMISSION_STATUSES)[number];

export const PRACTICE_SUBMISSION_VERDICTS = [
  "accepted",
  "wrong_answer",
  "partial",
  "runtime_error",
  "failed",
] as const;

export type PracticeSubmissionVerdict = (typeof PRACTICE_SUBMISSION_VERDICTS)[number];

export interface PracticeSubmissionTestcase {
  name: string;
  passed: boolean;
  message: string;
}

export interface PracticeSubmissionPayload {
  submissionId: string;
  status: PracticeSubmissionStatus;
  score: number | null;
  verdict: PracticeSubmissionVerdict | null;
  feedback: string | null;
  testcases: PracticeSubmissionTestcase[];
  judgedBy: "gemini" | null;
  updatedAt: string;
  errorMessage: string | null;
}
