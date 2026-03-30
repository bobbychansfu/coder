import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";
import { prisma as _prisma } from "@/lib/prisma";
import {
  APP_LANGUAGES,
  codingLanguageToAppLanguage,
  codingLanguageToLabel,
} from "../../coding-language";
import { normalizePracticeSubmissionTestcases } from "@/lib/practiceSubmission";
import { mapPracticeRunRecordToSubmissionPayload } from "@/server/practice/submissionService";

export type PrismaClient = typeof _prisma;

// ---------------------------------------------------------------------------
// Shared helpers (also used by practiceExecution router)
// ---------------------------------------------------------------------------

export async function getDbUser(ctx: {
  prisma: PrismaClient;
  user: { computingId: string };
}): Promise<{ id: string }> {
  const dbUser = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true },
  });
  if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });
  return dbUser;
}

export async function getProblemByCode(
  ctx: { prisma: PrismaClient },
  problemCode: string,
): Promise<{ id: string; code: string }> {
  const problem = await ctx.prisma.problem.findFirst({
    where: {
      code: problemCode,
      isDraft: false,
      manageStatus: "ACTIVE",
      source: { in: ["PRACTICE", "BOTH"] },
    },
    select: { id: true, code: true },
  });
  if (!problem) throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
  return problem;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function mapRunVerdictToStatus(verdict: string): "accepted" | "wrong" | "tle" {
  if (verdict === "Accepted") return "accepted";
  if (verdict === "Time Limit Exceeded") return "tle";
  return "wrong";
}

// ---------------------------------------------------------------------------
// Render router — queries for displaying the practice UI
// ---------------------------------------------------------------------------

export const practiceRouter = router({
  listProblems: studentProcedure
    .input(
      z.object({
        difficulty: z.string().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);

      const andClauses: object[] = [];
      if (input.difficulty) {
        andClauses.push({ difficulty: { equals: input.difficulty, mode: "insensitive" } });
      }
      if (input.tag) {
        andClauses.push({ topics: { some: { name: { equals: input.tag, mode: "insensitive" } } } });
      }
      if (input.search) {
        andClauses.push({
          OR: [
            { title: { contains: input.search, mode: "insensitive" } },
            { statement: { contains: input.search, mode: "insensitive" } },
          ],
        });
      }

      const problems = await ctx.prisma.problem.findMany({
        where: {
          isDraft: false,
          manageStatus: "ACTIVE",
          source: { in: ["PRACTICE", "BOTH"] },
          ...(andClauses.length > 0 ? { AND: andClauses } : {}),
        },
        include: { topics: true },
        orderBy: { title: "asc" },
      });

      const sessions = await ctx.prisma.practiceSession.findMany({
        where: { userId: dbUser.id },
        select: {
          solvedAt: true,
          problem: { select: { code: true } },
        },
      });
      const solvedCodes = new Set(
        sessions.filter((s) => s.solvedAt != null).map((s) => s.problem.code),
      );
      const startedCodes = new Set(sessions.map((s) => s.problem.code));

      let filtered = problems;
      if (input.status === "completed") {
        filtered = problems.filter((p) => solvedCodes.has(p.code));
      } else if (input.status === "not-started") {
        filtered = problems.filter((p) => !startedCodes.has(p.code));
      }

      return filtered.map((p) => ({
        code: p.code,
        title: p.title,
        difficulty: p.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        points: p.points ?? 0,
        tags: p.topics.map((t) => t.name),
        solved: solvedCodes.has(p.code),
      }));
    }),

  getProblemDetail: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const problem = await ctx.prisma.problem.findUnique({
        where: { code: input.problemCode },
        include: { topics: true, starterCodes: true },
      });
      if (
        !problem ||
        problem.isDraft ||
        problem.manageStatus !== "ACTIVE" ||
        !["PRACTICE", "BOTH"].includes(problem.source)
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }

      return {
        id: problem.id,
        code: problem.code,
        title: problem.title,
        difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        tags: problem.topics.map((t) => t.name),
        timeComplexity: "",
        spaceComplexity: "",
        solvedBy: 0,
        points: problem.points ?? 0,
        timeLimit: problem.timeConstraint
          ? `${problem.timeConstraint} second${problem.timeConstraint !== 1 ? "s" : ""}`
          : "1 second",
        memory: problem.memConstraint ? `${problem.memConstraint} MB` : "256 MB",
        statement: [problem.statement],
        inputFormat: problem.inputFormat ? [problem.inputFormat] : ([] as string[]),
        outputFormat: problem.outputFormat ? [problem.outputFormat] : ([] as string[]),
        constraints: problem.constraints
          ? problem.constraints.split("\n").filter(Boolean)
          : ([] as string[]),
        example: {
          input: problem.exampleInput ? [problem.exampleInput] : ([] as string[]),
          output: problem.exampleOutput ? [problem.exampleOutput] : ([] as string[]),
          explanation: problem.exampleExplanation ?? "",
        },
        testCases: [] as { id: string; input: string; expected: string; sample?: boolean }[],
        hiddenCount: 0,
        starterCodes: Object.fromEntries(
          problem.starterCodes.map((sc) => [codingLanguageToAppLanguage(sc.language), sc.code]),
        ) as Partial<Record<(typeof APP_LANGUAGES)[number], string>>,
        submissions: [] as {
          id: string;
          status: "accepted" | "wrong" | "tle";
          language: string;
          runtime: string;
          memory: string;
          submitted: string;
        }[],
        editorial: { approach: "", timeComplexity: "", spaceComplexity: "", note: "" },
      };
    }),

  getRunHistory: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const problem = await getProblemByCode(ctx, input.problemCode);

      const session = await ctx.prisma.practiceSession.findUnique({
        where: { userId_problemId: { userId: dbUser.id, problemId: problem.id } },
        include: { runs: { orderBy: { createdAt: "desc" }, take: 20 } },
      });

      if (!session) return [];

      return session.runs.map((run) => ({
        id: run.id,
        status: mapRunVerdictToStatus(run.verdict),
        language: codingLanguageToLabel(run.language),
        runtime: run.runtimeMs ? `${run.runtimeMs}ms` : "-",
        memory: "-",
        submitted: formatTimeAgo(run.createdAt),
      }));
    }),

  getLatestRunRecord: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const problem = await getProblemByCode(ctx, input.problemCode);

      const record = await ctx.prisma.practiceRunRecord.findFirst({
        where: { session: { userId: dbUser.id, problemId: problem.id } },
        orderBy: { createdAt: "desc" },
      });

      if (!record) return null;

      return {
        id: record.id,
        language: codingLanguageToAppLanguage(record.language),
        code: record.code,
        status: mapPracticeRunRecordToSubmissionPayload(record).status,
        verdict: record.verdict,
        feedback: record.feedback,
        errorMessage: record.errorMessage,
        testcases: normalizePracticeSubmissionTestcases(record.testcases),
      };
    }),

});
