import type {
  PracticeSubmissionPayload,
  PracticeSubmissionTestcase,
  PracticeSubmissionVerdict,
} from "@/lib/practiceSubmission";

export interface VisiblePracticeTest {
  name: string;
  input: string;
  expectedOutput: string;
}

export interface JudgingProblemContext {
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
}

export interface JudgingProviderInput {
  submissionId: string;
  language: "cpp" | "java" | "typescript" | "javascript" | "python";
  code: string;
  problem: JudgingProblemContext;
  visibleTests: VisiblePracticeTest[];
}

export interface JudgingProviderResult {
  score: number;
  verdict: PracticeSubmissionVerdict;
  feedback: string;
  testcases: PracticeSubmissionTestcase[];
  rawProviderResponse?: unknown;
}

export interface JudgingProvider {
  readonly name: NonNullable<PracticeSubmissionPayload["judgedBy"]>;
  judgeSubmission(input: JudgingProviderInput): Promise<JudgingProviderResult>;
}
