import { practiceProblems, PracticeProblem } from "@/fe/practice/data/practiceProblems";
import type { ProblemDetail, ProblemTestCase } from "@/fe/contests/data/problemDetails";

export const getPracticeProblems = async (): Promise<PracticeProblem[]> => {
  // Simulate API delay
  // await new Promise((resolve) => setTimeout(resolve, 500));
  return practiceProblems;
};

export interface PracticeJudgeCaseResult {
  id: string;
  input: string;
  expected: string;
  output: string;
  passed: boolean;
}

export interface PracticeJudgeResult {
  verdict: "Accepted" | "Wrong Answer";
  runtimeMs: number;
  memoryMb: number;
  summary: string;
  cases: PracticeJudgeCaseResult[];
}

const JUDGE_DELAY_MS = 900;
const CODE_QUALITY_HINTS = [
  "return",
  "for",
  "while",
  "if",
  "cout",
  "print",
  "System.out",
  "console.log",
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function buildFailedOutput(expected: string, seed: number): string {
  if (expected.length === 0) {
    return "No output";
  }

  if (expected.length === 1) {
    return `${Number(expected) + 1}`;
  }

  const rotation = seed % expected.length;
  return `${expected.slice(rotation)}${expected.slice(0, rotation)}`;
}

function evaluateCase(
  testCase: ProblemTestCase,
  code: string,
  language: string,
  index: number,
): PracticeJudgeCaseResult {
  const normalizedCode = code.trim();
  const baseSeed = hashText(`${normalizedCode}|${language}|${testCase.id}|${index}`);

  if (normalizedCode.length === 0) {
    return {
      id: testCase.id,
      input: testCase.input,
      expected: testCase.expected,
      output: "No output",
      passed: false,
    };
  }

  const hasQualitySignal = CODE_QUALITY_HINTS.some((hint) => normalizedCode.includes(hint));
  const threshold = hasQualitySignal ? 85 : 55;
  const passed = baseSeed % 100 < threshold;

  return {
    id: testCase.id,
    input: testCase.input,
    expected: testCase.expected,
    output: passed ? testCase.expected : buildFailedOutput(testCase.expected, baseSeed),
    passed,
  };
}

export async function runPracticeCode(
  detail: ProblemDetail,
  code: string,
  language: string,
): Promise<PracticeJudgeResult> {
  await delay(JUDGE_DELAY_MS);

  const sampleCases = detail.testCases.filter((testCase) => testCase.sample);
  const cases = sampleCases.map((testCase, index) =>
    evaluateCase(testCase, code, language, index),
  );

  const passedCount = cases.filter((item) => item.passed).length;
  const allPassed = cases.length > 0 && passedCount === cases.length;
  const seed = hashText(`${detail.title}|${code}|${language}`);

  return {
    verdict: allPassed ? "Accepted" : "Wrong Answer",
    runtimeMs: 60 + (seed % 120),
    memoryMb: 18 + (seed % 36),
    summary: `${passedCount}/${cases.length} sample test cases passed`,
    cases,
  };
}
