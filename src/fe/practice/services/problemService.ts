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
