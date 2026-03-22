import { Prisma, type CodingLanguage, type PracticeRunRecord } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PracticeSubmissionPayload, PracticeSubmissionVerdict } from "@/lib/practiceSubmission";
import {
  appLanguageToCodingLanguage,
  codingLanguageToAppLanguage,
  parseAppLanguage,
  type AppLanguage,
} from "@/server/coding-language";
import { practiceSubmissionEvents } from "./submissionEvents";
import type {
  JudgingProblemContext,
  JudgingProvider,
  JudgingProviderInput,
  VisiblePracticeTest,
} from "./provider";
import { GeminiJudgingProvider } from "./providers/geminiJudgingProvider";

type PracticeProblemRecord = JudgingProblemContext & {
  source: "PRACTICE" | "CONTEST" | "BOTH";
};

function getNow() {
  return new Date();
}

function logInfo(message: string, context: Record<string, unknown>) {
  console.info(`[practice-judge] ${message}`, context);
}

function logError(message: string, context: Record<string, unknown>) {
  console.error(`[practice-judge] ${message}`, context);
}

function getJudgingProvider(): JudgingProvider {
  const mode = (process.env.JUDGING_MODE ?? "gemini").trim().toLowerCase();

  if (mode === "gemini") {
    return new GeminiJudgingProvider();
  }

  throw new Error(`Unsupported JUDGING_MODE "${mode}".`);
}

function getConfiguredProviderName(): PracticeSubmissionPayload["judgedBy"] {
  const mode = (process.env.JUDGING_MODE ?? "gemini").trim().toLowerCase();
  return mode === "gemini" ? "gemini" : null;
}

export function getSubmissionVerdictLabel(verdict: PracticeSubmissionVerdict | null): string {
  switch (verdict) {
    case "accepted":
      return "Accepted";
    case "partial":
      return "Partial";
    case "runtime_error":
      return "Runtime Error";
    case "failed":
      return "Failed";
    case "wrong_answer":
      return "Wrong Answer";
    default:
      return "Pending";
  }
}

function buildVisibleTests(problem: PracticeProblemRecord): VisiblePracticeTest[] {
  const tests: VisiblePracticeTest[] = [];

  if (problem.exampleInput || problem.exampleOutput) {
    tests.push({
      name: "Example",
      input: problem.exampleInput ?? "",
      expectedOutput: problem.exampleOutput ?? "",
    });
  }

  return tests;
}

export async function findDbUserIdByComputingId(computingId: string): Promise<string | null> {
  const dbUser = await prisma.user.findUnique({
    where: { computingId },
    select: { id: true },
  });

  return dbUser?.id ?? null;
}

export async function getPracticeProblemById(problemId: string): Promise<PracticeProblemRecord | null> {
  const problem = await prisma.problem.findFirst({
    where: {
      id: problemId,
      source: { in: ["PRACTICE", "BOTH"] },
    },
    select: {
      id: true,
      code: true,
      title: true,
      statement: true,
      inputFormat: true,
      outputFormat: true,
      constraints: true,
      exampleInput: true,
      exampleOutput: true,
      exampleExplanation: true,
      source: true,
    },
  });

  return problem;
}

export function parseSubmissionLanguage(language: string | null | undefined): AppLanguage | null {
  return parseAppLanguage(language ?? "");
}

async function publishSubmissionEvent(submissionId: string) {
  const payload = await getPracticeSubmissionPayload(submissionId);
  if (!payload) {
    return;
  }

  practiceSubmissionEvents.publish(payload.status, payload);
}

export async function createPracticeSubmission(args: {
  userId: string;
  problemId: string;
  language: AppLanguage;
  code: string;
  createdAt?: Date;
}) {
  const codingLanguage = appLanguageToCodingLanguage(args.language);
  if (!codingLanguage) {
    throw new Error("Unsupported language.");
  }

  const problem = await getPracticeProblemById(args.problemId);
  if (!problem) {
    throw new Error("Problem not found.");
  }

  const createdAt = args.createdAt ?? getNow();
  const existingSession = await prisma.practiceSession.findUnique({
    where: {
      userId_problemId: {
        userId: args.userId,
        problemId: args.problemId,
      },
    },
    select: {
      id: true,
      firstSubmitAt: true,
    },
  });

  const session = existingSession
    ? await prisma.practiceSession.update({
        where: { id: existingSession.id },
        data: {
          firstSubmitAt: existingSession.firstSubmitAt ?? createdAt,
          selectedLang: codingLanguage,
          submitCount: { increment: 1 },
        },
      })
    : await prisma.practiceSession.create({
        data: {
          userId: args.userId,
          problemId: args.problemId,
          firstSubmitAt: createdAt,
          selectedLang: codingLanguage,
          submitCount: 1,
        },
      });

  const record = await prisma.practiceRunRecord.create({
    data: {
      sessionId: session.id,
      userId: args.userId,
      problemId: args.problemId,
      source: "practice",
      status: "queued",
      isSubmit: true,
      language: codingLanguage,
      code: args.code,
      verdict: "Pending",
      judgedBy: getConfiguredProviderName(),
      createdAt,
      stdout: null,
      stderr: null,
    },
  });

  logInfo("submission created", {
    submissionId: record.id,
    problemId: args.problemId,
    language: args.language,
  });

  await publishSubmissionEvent(record.id);

  void runPracticeSubmissionJudging({
    submissionId: record.id,
    problem,
  }).catch((error) => {
    logError("submission failed", {
      submissionId: record.id,
      problemId: args.problemId,
      language: args.language,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  });

  return record;
}

async function runPracticeSubmissionJudging(args: {
  submissionId: string;
  problem: PracticeProblemRecord;
}) {
  const record = await prisma.practiceRunRecord.findUnique({
    where: { id: args.submissionId },
  });

  if (!record) {
    return;
  }

  const runningAt = Date.now();
  await prisma.practiceRunRecord.update({
    where: { id: record.id },
    data: {
      status: "running",
      errorMessage: null,
    },
  });

  logInfo("submission running", {
    submissionId: record.id,
    problemId: record.problemId,
    language: codingLanguageToAppLanguage(record.language),
  });

  await publishSubmissionEvent(record.id);

  try {
    const provider = getJudgingProvider();

    logInfo("gemini request started", {
      submissionId: record.id,
      problemId: record.problemId,
      language: codingLanguageToAppLanguage(record.language),
    });

    const input: JudgingProviderInput = {
      submissionId: record.id,
      language: toProviderLanguage(record.language),
      code: record.code,
      problem: args.problem,
      visibleTests: buildVisibleTests(args.problem),
    };

    const result = await provider.judgeSubmission(input);

    logInfo("gemini response parsed", {
      submissionId: record.id,
      latencyMs: Date.now() - runningAt,
      verdict: result.verdict,
      score: result.score,
    });

    const verdictLabel = getSubmissionVerdictLabel(result.verdict);
    const compilePassed = result.verdict !== "failed" && result.verdict !== "runtime_error";

    await prisma.practiceRunRecord.update({
      where: { id: record.id },
      data: {
        status: "done",
        score: result.score,
        verdict: verdictLabel,
        feedback: result.feedback,
        testcases: result.testcases as unknown as Prisma.InputJsonValue,
        compilePassed,
        judgedBy: provider.name,
        rawProviderResponse:
          result.rawProviderResponse == null
            ? Prisma.JsonNull
            : (result.rawProviderResponse as Prisma.InputJsonValue),
        stdout: result.feedback,
        stderr: null,
        errorMessage: null,
      },
    });

    if (result.verdict === "accepted") {
      await prisma.practiceSession.updateMany({
        where: { id: record.sessionId, solvedAt: null },
        data: { solvedAt: getNow() },
      });
    }

    logInfo("submission done", {
      submissionId: record.id,
      problemId: record.problemId,
      verdict: result.verdict,
      score: result.score,
      latencyMs: Date.now() - runningAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown judging error";

    await prisma.practiceRunRecord.update({
      where: { id: record.id },
      data: {
        status: "failed",
        verdict: "Failed",
        compilePassed: false,
        score: 0,
        feedback: null,
        stdout: null,
        stderr: message,
        errorMessage: message,
      },
    });

    logError("submission failed", {
      submissionId: record.id,
      problemId: record.problemId,
      language: codingLanguageToAppLanguage(record.language),
      latencyMs: Date.now() - runningAt,
      error: message,
    });
  }

  await publishSubmissionEvent(record.id);
}

function toProviderLanguage(language: CodingLanguage): "cpp" | "java" | "typescript" | "javascript" | "python" {
  const appLanguage = codingLanguageToAppLanguage(language);
  return appLanguage === "cplusplus" ? "cpp" : appLanguage;
}

export async function getPracticeSubmissionRecordForUser(args: {
  submissionId: string;
  userId: string;
}) {
  return prisma.practiceRunRecord.findFirst({
    where: {
      id: args.submissionId,
      userId: args.userId,
      source: "practice",
    },
  });
}

export async function getPracticeSubmissionPayload(
  submissionId: string,
): Promise<PracticeSubmissionPayload | null> {
  const record = await prisma.practiceRunRecord.findUnique({
    where: { id: submissionId },
  });

  return record ? mapPracticeRunRecordToSubmissionPayload(record) : null;
}

export function mapPracticeRunRecordToSubmissionPayload(
  record: Pick<
    PracticeRunRecord,
    | "id"
    | "status"
    | "score"
    | "feedback"
    | "testcases"
    | "judgedBy"
    | "updatedAt"
    | "errorMessage"
    | "verdict"
  >,
): PracticeSubmissionPayload {
  return {
    submissionId: record.id,
    status: normalizeSubmissionStatus(record.status),
    score: record.score ?? null,
    verdict: normalizeVerdictLabel(record.verdict),
    feedback: record.feedback ?? null,
    testcases: Array.isArray(record.testcases)
      ? (record.testcases as unknown as PracticeSubmissionPayload["testcases"])
      : [],
    judgedBy: record.judgedBy === "gemini" ? "gemini" : null,
    updatedAt: record.updatedAt.toISOString(),
    errorMessage: record.errorMessage ?? null,
  };
}

function normalizeSubmissionStatus(status: string): PracticeSubmissionPayload["status"] {
  switch (status) {
    case "running":
    case "done":
    case "failed":
      return status;
    case "queued":
    default:
      return "queued";
  }
}

function normalizeVerdictLabel(verdict: string): PracticeSubmissionPayload["verdict"] {
  switch (verdict.trim().toLowerCase()) {
    case "accepted":
      return "accepted";
    case "partial":
      return "partial";
    case "runtime error":
      return "runtime_error";
    case "failed":
      return "failed";
    case "wrong answer":
      return "wrong_answer";
    default:
      return null;
  }
}
