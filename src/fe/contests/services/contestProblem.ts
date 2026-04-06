import type { ContestProblem } from "@/fe/contests/data/contestDetails";
import type { ProblemDetail, SubmissionRecord } from "@/fe/contests/data/problemDetails";

type StarterCodeLanguage = "CPLUSPLUS" | "JAVA" | "TYPESCRIPT" | "JAVASCRIPT" | "PYTHON";
type SubmissionLanguage = StarterCodeLanguage;
type SubmissionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "SYSTEM_ERROR"
  | "COMPILE_ERROR";

interface ContestProblemTopic {
  name: string;
}

interface ContestProblemStarterCode {
  language: StarterCodeLanguage;
  code: string;
}

interface ContestProblemApiModel {
  id: string;
  code: string;
  title: string;
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  exampleInput: string | null;
  exampleOutput: string | null;
  exampleExplanation: string | null;
  difficulty: string;
  timeConstraint: number | null;
  memConstraint: number | null;
  points: number | null;
  topics?: ContestProblemTopic[];
  starterCodes?: ContestProblemStarterCode[];
}

interface ContestSubmissionApiModel {
  id: string;
  status: SubmissionStatus;
  language: SubmissionLanguage;
  languageLabel?: string;
  createdAt: string;
  score?: number | null;
  runtime?: string | null;
  memory?: string | null;
  judgeOutput?: string;
}

export interface ContestProblemDetailResponse {
  computingId: string;
  cid: string;
  pid: string;
  problem: ContestProblemApiModel | null;
  downloadContents: string[];
  role: string;
  htmlContents: string | string[];
}

export interface ContestProblemSubmissionsResponse {
  computingId: string;
  submissions: ContestSubmissionApiModel[];
  problem: ContestProblemApiModel | null;
}

function mapLanguageToAppLanguage(language: StarterCodeLanguage) {
  switch (language) {
    case "CPLUSPLUS":
      return "cplusplus";
    case "JAVA":
      return "java";
    case "TYPESCRIPT":
      return "typescript";
    case "JAVASCRIPT":
      return "javascript";
    case "PYTHON":
      return "python";
  }
}

function mapLanguageToLabel(language: SubmissionLanguage) {
  switch (language) {
    case "CPLUSPLUS":
      return "C++";
    case "JAVA":
      return "Java";
    case "TYPESCRIPT":
      return "TypeScript";
    case "JAVASCRIPT":
      return "JavaScript";
    case "PYTHON":
      return "Python";
  }
}

function mapSubmissionStatus(status: SubmissionStatus): SubmissionRecord["status"] {
  switch (status) {
    case "ACCEPTED":
      return "accepted";
    case "TIME_LIMIT_EXCEEDED":
      return "tle";
    case "PENDING":
      return "pending";
    case "COMPILE_ERROR":
      return "compile_error";
    case "SYSTEM_ERROR":
      return "system_error";
    case "RUNTIME_ERROR":
      return "runtime_error";
    case "WRONG_ANSWER":
    default:
      return "wrong";
  }
}

function formatTimeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;

  if (!Number.isFinite(timestamp) || diffMs < 0) {
    return "just now";
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function splitLines(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function adaptContestSubmissionRecords(
  payload: ContestProblemSubmissionsResponse | null | undefined,
): SubmissionRecord[] {
  if (!payload) {
    return [];
  }

  return payload.submissions.map((submission) => ({
    id: submission.id,
    status: mapSubmissionStatus(submission.status),
    language: submission.languageLabel ?? mapLanguageToLabel(submission.language),
    runtime: submission.runtime?.trim() || "-",
    memory: submission.memory?.trim() || "-",
    submitted: formatTimeAgo(submission.createdAt),
  }));
}

export function adaptContestProblemDetail(
  contestProblem: ContestProblem,
  payload: ContestProblemDetailResponse,
  submissionsPayload?: ContestProblemSubmissionsResponse | null,
): ProblemDetail {
  const problem = payload.problem;

  return {
    ...contestProblem,
    problemId: contestProblem.problemId ?? payload.pid,
    tags:
      problem?.topics && problem.topics.length > 0
        ? problem.topics.map((topic) => topic.name)
        : contestProblem.tags,
    points: problem?.points ?? contestProblem.points,
    timeLimit: problem?.timeConstraint
      ? `${problem.timeConstraint} second${problem.timeConstraint !== 1 ? "s" : ""}`
      : "1 second",
    memory: problem?.memConstraint ? `${problem.memConstraint} MB` : "256 MB",
    statement: problem?.statement ? [problem.statement] : [],
    inputFormat: splitLines(problem?.inputFormat),
    outputFormat: splitLines(problem?.outputFormat),
    constraints: splitLines(problem?.constraints),
    example: {
      input: problem?.exampleInput ? [problem.exampleInput] : [],
      output: problem?.exampleOutput ? [problem.exampleOutput] : [],
      explanation: problem?.exampleExplanation ?? "",
    },
    testCases: [],
    hiddenCount: 0,
    starterCodes: Object.fromEntries(
      (problem?.starterCodes ?? []).map((starterCode) => [
        mapLanguageToAppLanguage(starterCode.language),
        starterCode.code,
      ]),
    ) as NonNullable<ProblemDetail["starterCodes"]>,
    submissions: adaptContestSubmissionRecords(submissionsPayload),
    editorial: {
      approach: "",
      timeComplexity: contestProblem.timeComplexity ?? "",
      spaceComplexity: contestProblem.spaceComplexity ?? "",
      note: "Editorial is unavailable during contests.",
    },
  };
}
