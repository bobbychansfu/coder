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

export function normalizePracticeSubmissionTestcases(
  value: unknown,
): PracticeSubmissionTestcase[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (testcase): testcase is Record<string, unknown> =>
        typeof testcase === "object" && testcase !== null,
    )
    .map((testcase, index) => ({
      name:
        typeof testcase.name === "string" && testcase.name.trim().length > 0
          ? testcase.name.trim()
          : `Visible test ${index + 1}`,
      passed: Boolean(testcase.passed),
      message: typeof testcase.message === "string" ? testcase.message.trim() : "",
    }));
}
