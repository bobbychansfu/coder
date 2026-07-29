import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";
import { codingLanguageToLabel } from "@/server/coding-language";
import type { CodeDraftMap } from "@/fe/shared/services/codeDraftStorage";
import { formatTimeAgo } from "@/fe/shared/services/timeFormatting";

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
  category: string;
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
  category: string;
  starterCodes: CodeDraftMap;
}

function normalizeDifficulty(difficulty: string): StudentDashboardPracticeHistoryItem["difficulty"] {
  const normalized = difficulty.trim().toLowerCase();

  if (normalized === "medium" || normalized === "hard") {
    return normalized;
  }

  return "easy";
}

function normalizeVerdict(verdict: string | null | undefined): string {
  return verdict?.trim().toLowerCase() ?? "";
}

function formatVerdict(verdict: string | null | undefined): string {
  switch (normalizeVerdict(verdict)) {
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

function mapVerdictToStatus(verdict: string | null | undefined): PracticeHistoryStatus {
  switch (normalizeVerdict(verdict)) {
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

  const recordedRuns = await prisma.practiceRunRecord.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
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
              topics: {
                select: {
                  name: true,
                },
                take: 1,
              },
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

  for (const run of recordedRuns) {
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
      category: problem.topics[0]?.name ?? "General",
      verdict: formatVerdict(run.verdict),
      status: mapVerdictToStatus(run.verdict),
      language: codingLanguageToLabel(run.language),
      practicedAt: formatTimeAgo(run.createdAt),
      practicedAtMs: run.createdAt.getTime(),
      href: `/practice/${encodeURIComponent(problem.code)}`,
    });
  }

  return history;
}
