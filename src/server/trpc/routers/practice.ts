import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";

const JUDGE_URL = process.env.JUDGE_URL ?? "http://127.0.0.1:8000";

// Map frontend language values → judge's langs.json keys
const JUDGE_LANG: Record<string, string> = {
  cpp: "C++17",
  java: "Java17",
  python: "py3",
  python3: "py3",
  javascript: "NodeJS",
  ruby: "Ruby",
};

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

async function getDbUser(ctx: { prisma: { user: { findUnique: (args: { where: { computingId: string }; select: { id: true } }) => Promise<{ id: string } | null> } }; user: { computingId: string } }) {
  const dbUser = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true },
  });
  if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });
  return dbUser;
}

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
        where: andClauses.length > 0 ? { AND: andClauses } : {},
        include: { topics: true },
        orderBy: { title: "asc" },
      });

      // Fetch solved status for the current user
      const sessions = await ctx.prisma.practiceSession.findMany({
        where: { userId: dbUser.id },
        include: { runs: { where: { verdict: "Accepted" }, take: 1 } },
      });
      const solvedCodes = new Set(
        sessions.filter((s) => s.runs.length > 0).map((s) => s.problemCode),
      );
      const startedCodes = new Set(sessions.map((s) => s.problemCode));

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
        include: { topics: true },
      });
      if (!problem) throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });

      return {
        code: problem.code,
        title: problem.title,
        difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        tags: problem.topics.map((t) => t.name),
        timeComplexity: "",
        spaceComplexity: "",
        solvedBy: 0,
        points: problem.points ?? 0,
        timeLimit: problem.timeConstraint ? `${problem.timeConstraint} second${problem.timeConstraint !== 1 ? "s" : ""}` : "1 second",
        memory: problem.memConstraint ? `${problem.memConstraint} MB` : "256 MB",
        statement: [problem.statement],
        inputFormat: problem.inputFormat ? [problem.inputFormat] : ([] as string[]),
        outputFormat: problem.outputFormat ? [problem.outputFormat] : ([] as string[]),
        constraints: problem.constraints ? problem.constraints.split("\n").filter(Boolean) : ([] as string[]),
        example: {
          input: problem.exampleInput ? [problem.exampleInput] : ([] as string[]),
          output: problem.exampleOutput ? [problem.exampleOutput] : ([] as string[]),
          explanation: problem.exampleExplanation ?? "",
        },
        testCases: [] as { id: string; input: string; expected: string; sample?: boolean }[],
        hiddenCount: 0,
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

      const session = await ctx.prisma.practiceSession.findUnique({
        where: { userId_problemCode: { userId: dbUser.id, problemCode: input.problemCode } },
        include: { runs: { orderBy: { createdAt: "desc" }, take: 20 } },
      });

      if (!session) return [];

      return session.runs.map((run) => ({
        id: run.id,
        status: (run.verdict === "Accepted" ? "accepted" : "wrong") as "accepted" | "wrong" | "tle",
        language: run.language,
        runtime: run.runtimeMs ? `${run.runtimeMs}ms` : "-",
        memory: "-",
        submitted: formatTimeAgo(run.createdAt),
      }));
    }),

  openSession: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);

      const session = await ctx.prisma.practiceSession.upsert({
        where: { userId_problemCode: { userId: dbUser.id, problemCode: input.problemCode } },
        create: { userId: dbUser.id, problemCode: input.problemCode },
        update: {},
      });

      return {
        sessionId: session.id,
        startedAt: session.startedAt,
        firstRunAt: session.firstRunAt,
        firstSubmitAt: session.firstSubmitAt,
      };
    }),

  runCode: studentProcedure
    .input(z.object({ problemCode: z.string(), language: z.string(), code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);

      const session = await ctx.prisma.practiceSession.findUnique({
        where: { userId_problemCode: { userId: dbUser.id, problemCode: input.problemCode } },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      const now = new Date();
      const updatedSession = await ctx.prisma.practiceSession.update({
        where: { id: session.id },
        data: {
          firstRunAt: session.firstRunAt ?? now,
          runCount: { increment: 1 },
        },
      });

      // Keep only the latest run record (delete previous non-submit records)
      await ctx.prisma.practiceRunRecord.deleteMany({
        where: { sessionId: session.id, isSubmit: false },
      });

      // Create a pending record — its ID becomes the connection_id sent to the judge
      const record = await ctx.prisma.practiceRunRecord.create({
        data: {
          sessionId: session.id,
          isSubmit: false,
          language: input.language,
          code: input.code,
          verdict: "Pending",
          compilePassed: false,
        },
      });

      // Submit to judge — result comes back asynchronously to /api/judge-callback
      const judgeLanguage = JUDGE_LANG[input.language] ?? input.language;
      let judgeReachable = true;
      try {
        await fetch(`${JUDGE_URL}/judge_submission`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sid: dbUser.id,
            pid: input.problemCode,
            language: judgeLanguage,
            connection_id: record.id,
            submission: input.code,
          }),
        });
      } catch {
        judgeReachable = false;
        await ctx.prisma.practiceRunRecord.update({
          where: { id: record.id },
          data: { verdict: "Judge Unreachable" },
        });
      }

      // Poll DB for the verdict (callback from judge updates the record)
      let finalRecord = record;
      if (judgeReachable) {
        const MAX_POLLS = 30;
        for (let i = 0; i < MAX_POLLS; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const updated = await ctx.prisma.practiceRunRecord.findUnique({
            where: { id: record.id },
          });
          if (updated && updated.verdict !== "Pending") {
            finalRecord = updated;
            break;
          }
        }
        // Timed out — mark as such
        if (finalRecord.verdict === "Pending") {
          await ctx.prisma.practiceRunRecord.update({
            where: { id: record.id },
            data: { verdict: "Timed Out" },
          });
          finalRecord = { ...finalRecord, verdict: "Timed Out" };
        }
      }

      return {
        verdict: finalRecord.verdict,
        compilePassed: finalRecord.compilePassed,
        stdout: finalRecord.stdout,
        stderr: finalRecord.stderr,
        runtimeMs: finalRecord.runtimeMs,
        runCount: updatedSession.runCount,
        firstRunAt: updatedSession.firstRunAt,
        record: {
          id: finalRecord.id,
          verdict: finalRecord.verdict,
          createdAt: finalRecord.createdAt,
        },
      };
    }),

  submitCode: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);

      const session = await ctx.prisma.practiceSession.findUnique({
        where: { userId_problemCode: { userId: dbUser.id, problemCode: input.problemCode } },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      const isFirstSubmit = !session.firstSubmitAt;
      const now = new Date();
      const updatedSession = await ctx.prisma.practiceSession.update({
        where: { id: session.id },
        data: { firstSubmitAt: session.firstSubmitAt ?? now },
      });

      if (isFirstSubmit) {
        // Copy metrics from the latest run record
        const lastRun = await ctx.prisma.practiceRunRecord.findFirst({
          where: { sessionId: session.id, isSubmit: false },
          orderBy: { createdAt: "desc" },
        });

        if (lastRun) {
          await ctx.prisma.practiceRunRecord.create({
            data: {
              sessionId: session.id,
              isSubmit: true,
              language: lastRun.language,
              code: lastRun.code,
              verdict: lastRun.verdict,
              compilePassed: lastRun.compilePassed,
              stdout: lastRun.stdout,
              stderr: lastRun.stderr,
              runtimeMs: lastRun.runtimeMs,
            },
          });
        }
      }

      return { firstSubmitAt: updatedSession.firstSubmitAt };
    }),
});
