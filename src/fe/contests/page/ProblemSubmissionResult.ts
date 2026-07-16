export interface RunResult {
  submissionId: string;
  status: "idle" | "submitting" | "done" | "failed";
  verdict: string | null;
  feedback: string | null;
  errorMessage: string | null;
  testcases: { name: string; passed: boolean; message: string }[];
}

export interface ContestSubmitResponse {
  sid: string;
  message: string;
  score?: number;
  status?: string;
  runtime?: string;
  memory?: string;
}

function formatVerdictLabel(verdict: string | null | undefined) {
  const normalized = verdict?.trim().toLowerCase();

  switch (normalized) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "wrong_answer":
    case "wrong answer":
    case "wrong":
      return "Wrong Answer";
    case "time_limit_exceeded":
    case "time limit exceeded":
    case "tle":
      return "Time Limit Exceeded";
    case "runtime_error":
    case "runtime error":
      return "Runtime Error";
    case "system_error":
    case "system error":
    case "judge_error":
    case "judge error":
    case "ierr":
    case "internal_error":
    case "internal error":
      return "System Error";
    case "compile_error":
    case "compile error":
      return "Compile Error";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

export function buildRunResult(input: {
  submissionId: string;
  status: RunResult["status"];
  verdict: string | null | undefined;
  feedback: string | null;
  errorMessage: string | null;
  testcases: RunResult["testcases"];
}): RunResult {
  return {
    submissionId: input.submissionId,
    status: input.status,
    verdict: formatVerdictLabel(input.verdict),
    feedback: input.feedback,
    errorMessage: input.errorMessage,
    testcases: input.testcases,
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
