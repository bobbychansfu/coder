import { GoogleGenAI } from "@google/genai";
import type {
  PracticeSubmissionTestcase,
  PracticeSubmissionVerdict,
} from "@/lib/practiceSubmission";
import type {
  JudgingProvider,
  JudgingProviderInput,
  JudgingProviderResult,
} from "../provider";

interface GeminiJudgeResponse {
  score?: number;
  verdict?: string;
  feedback?: string;
  testcases?: Array<{
    name?: string;
    passed?: boolean;
    message?: string;
  }>;
}

function buildPrompt(input: JudgingProviderInput): string {
  const visibleTests =
    input.visibleTests.length > 0
      ? input.visibleTests
          .map(
            (test, index) =>
              [
                `Visible Test ${index + 1}: ${test.name}`,
                `Input:`,
                test.input,
                `Expected Output:`,
                test.expectedOutput,
              ].join("\n"),
          )
          .join("\n\n")
      : "No visible tests were provided.";

  return [
    "You are a temporary AI coding judge used only for local development flow validation.",
    "You are not executing code. Do not claim that you compiled or ran the submission.",
    "Evaluate conservatively using only the problem statement, the submitted code, and the visible tests.",
    "If the solution looks incomplete, incorrect, or uncertain, lower the score and avoid accepted.",
    "Return JSON only with keys: score, verdict, feedback, testcases.",
    'Allowed verdicts: "accepted", "wrong_answer", "partial", "runtime_error", "failed".',
    "Each testcase must include name, passed, and message.",
    "",
    `Submission ID: ${input.submissionId}`,
    `Language: ${input.language}`,
    `Problem Code: ${input.problem.code}`,
    `Problem Title: ${input.problem.title}`,
    "",
    "Problem Statement:",
    input.problem.statement,
    "",
    "Input Format:",
    input.problem.inputFormat ?? "Not provided.",
    "",
    "Output Format:",
    input.problem.outputFormat ?? "Not provided.",
    "",
    "Constraints:",
    input.problem.constraints ?? "Not provided.",
    "",
    "Example Input:",
    input.problem.exampleInput ?? "Not provided.",
    "",
    "Example Output:",
    input.problem.exampleOutput ?? "Not provided.",
    "",
    "Example Explanation:",
    input.problem.exampleExplanation ?? "Not provided.",
    "",
    "Visible Tests:",
    visibleTests,
    "",
    "Submitted Code:",
    "```",
    input.code,
    "```",
  ].join("\n");
}

function normalizeVerdict(value: string | undefined): PracticeSubmissionVerdict {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "accepted":
    case "ac":
      return "accepted";
    case "partial":
    case "partial_credit":
      return "partial";
    case "runtime_error":
    case "runtime error":
    case "re":
      return "runtime_error";
    case "failed":
    case "error":
      return "failed";
    case "wrong_answer":
    case "wrong answer":
    case "wa":
    default:
      return "wrong_answer";
  }
}

function clampScore(value: number | undefined, verdict: PracticeSubmissionVerdict): number {
  const numeric = Number.isFinite(value) ? Math.round(Number(value)) : 0;
  const bounded = Math.min(100, Math.max(0, numeric));

  if (verdict === "accepted") {
    return Math.max(bounded, 90);
  }

  if (verdict === "partial") {
    return Math.min(Math.max(bounded, 25), 80);
  }

  if (verdict === "runtime_error" || verdict === "failed") {
    return Math.min(bounded, 20);
  }

  return Math.min(bounded, 60);
}

function normalizeTestcases(
  value: GeminiJudgeResponse["testcases"],
): PracticeSubmissionTestcase[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 10).map((testcase, index) => ({
    name: testcase.name?.trim() || `Visible test ${index + 1}`,
    passed: Boolean(testcase.passed),
    message: testcase.message?.trim() || "",
  }));
}

export class GeminiJudgingProvider implements JudgingProvider {
  readonly name = "gemini" as const;

  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY for Gemini judging mode.");
    }

    this.model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    this.client = new GoogleGenAI({ apiKey });
  }

  async judgeSubmission(input: JudgingProviderInput): Promise<JudgingProviderResult> {
    const startedAt = Date.now();
    const prompt = buildPrompt(input);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsed: GeminiJudgeResponse;
    try {
      parsed = JSON.parse(rawText) as GeminiJudgeResponse;
    } catch (error) {
      throw new Error(
        `Failed to parse Gemini JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    const verdict = normalizeVerdict(parsed.verdict);
    const testcases = normalizeTestcases(parsed.testcases);

    return {
      score: clampScore(parsed.score, verdict),
      verdict,
      feedback: parsed.feedback?.trim() || "No detailed feedback returned by Gemini.",
      testcases,
      rawProviderResponse: {
        model: this.model,
        latencyMs: Date.now() - startedAt,
        responseId: response.responseId,
        modelVersion: response.modelVersion,
        text: rawText,
        usageMetadata: response.usageMetadata,
      },
    };
  }
}
