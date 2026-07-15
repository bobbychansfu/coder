import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import {
  codingLanguageToAppLanguage,
  codingLanguageToLabel,
} from "@/server/coding-language";
import type {
  CodeDraftMap,
  SupportedCodeLanguage,
} from "@/fe/shared/services/codeDraftStorage";

export type PracticeHistoryStatus =
  | "accepted"
  | "wrong"
  | "partial"
  | "failed"
  | "runtime_error"
  | "pending"
  | "draft";

export interface StudentDashboardPracticeHistoryItem {
  id: string;
  problemCode: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  verdict: string;
  status: PracticeHistoryStatus;
  language: string;
  practicedAt: string;
  practicedAtMs: number;
  href: string;
}

export interface StudentDashboardPracticeProblemCatalogItem {
  problemCode: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  starterCodes: CodeDraftMap;
}

function normalizeDifficulty(difficulty: string): StudentDashboardPracticeHistoryItem["difficulty"] {
  const normalized = difficulty.trim().toLowerCase();

  if (normalized === "medium" || normalized === "hard") {
    return normalized;
  }

  return "easy";
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatVerdict(verdict: string): string {
  switch (verdict.trim().toLowerCase()) {
    case "accepted":
      return "Accepted";
    case "wrong_answer":
    case "wrong answer":
      return "Wrong Answer";
    case "partial":
      return "Partial";
    case "runtime_error":
    case "runtime error":
      return "Runtime Error";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    default:
      return verdict || "Pending";
  }
}

function mapVerdictToStatus(verdict: string): PracticeHistoryStatus {
  switch (verdict.trim().toLowerCase()) {
    case "accepted":
      return "accepted";
    case "partial":
      return "partial";
    case "runtime_error":
    case "runtime error":
      return "runtime_error";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    case "wrong_answer":
    case "wrong answer":
    default:
      return "wrong";
  }
}

export async function getStudentPracticeHistory(
  user: CurrentUser,
): Promise<StudentDashboardPracticeHistoryItem[]> {
  const dbUser = await prisma.user.findUnique({
    where: { computingId: user.computingId },
    select: { id: true },
  });

  if (!dbUser) {
    return [];
  }

  const recentRuns = await prisma.practiceRunRecord.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      verdict: true,
      language: true,
      code: true,
      createdAt: true,
      session: {
        select: {
          problem: {
            select: {
              code: true,
              title: true,
              difficulty: true,
              starterCodes: {
                select: {
                  language: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const seenProblemCodes = new Set<string>();
  const history: StudentDashboardPracticeHistoryItem[] = [];

  for (const run of recentRuns) {
    const problem = run.session.problem;
    const starterCode = problem.starterCodes.find(
      (starter) => starter.language === run.language,
    )?.code;
    const hasModifiedSolution =
      starterCode === undefined || run.code.trim() !== starterCode.trim();

    if (!hasModifiedSolution || seenProblemCodes.has(problem.code)) {
      continue;
    }

    seenProblemCodes.add(problem.code);
    history.push({
      id: run.id,
      problemCode: problem.code,
      title: problem.title,
      difficulty: normalizeDifficulty(problem.difficulty),
      verdict: formatVerdict(run.verdict),
      status: mapVerdictToStatus(run.verdict),
      language: codingLanguageToLabel(run.language),
      practicedAt: formatTimeAgo(run.createdAt),
      practicedAtMs: run.createdAt.getTime(),
      href: `/practice/${encodeURIComponent(problem.code)}`,
    });

    if (history.length === 3) {
      break;
    }
  }

  return history;
}

export async function getStudentPracticeProblemCatalog(): Promise<
  StudentDashboardPracticeProblemCatalogItem[]
> {
  const problems = await prisma.problem.findMany({
    where: {
      isDraft: false,
      manageStatus: "ACTIVE",
      source: { in: ["PRACTICE", "BOTH"] },
    },
    orderBy: { title: "asc" },
    select: {
      code: true,
      title: true,
      difficulty: true,
      starterCodes: {
        select: {
          language: true,
          code: true,
        },
      },
    },
  });

  return problems.map((problem) => ({
    problemCode: problem.code,
    title: problem.title,
    difficulty: normalizeDifficulty(problem.difficulty),
    starterCodes: Object.fromEntries(
      problem.starterCodes.map((starter) => [
        codingLanguageToAppLanguage(starter.language) as SupportedCodeLanguage,
        starter.code,
      ]),
    ) as CodeDraftMap,
  }));
}
