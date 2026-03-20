import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { CodingLanguage } from "@prisma/client";
import { router, studentProcedure } from "../init";
import {
  APP_LANGUAGES,
  appLanguageToCodingLanguage,
  appLanguageToJudgeLanguage,
} from "../../coding-language";
import { getDbUser, getProblemByCode, type PrismaClient } from "./practice";

const JUDGE_URL = process.env.JUDGE_URL ?? "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Input schema shared by runCode and submitCode
// ---------------------------------------------------------------------------

export const practiceExecutionInput = z.object({
  sessionId: z.string(),
  problemId: z.string(),
  language: z.enum(APP_LANGUAGES),
  code: z.string(),
  timestamp: z.coerce.date(),
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getPracticeSession(
  ctx: { prisma: PrismaClient },
  userId: string,
  sessionId: string,
  problemId: string,
) {
  const session = await ctx.prisma.practiceSession.findFirst({
    where: { id: sessionId, userId, problemId },
    include: { problem: { select: { code: true } } },
  });
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  return session;
}

async function judgePracticeRecord(
  ctx: { prisma: PrismaClient },
  args: {
    sessionId: string;
    isSubmit: boolean;
    codingLanguage: CodingLanguage;
    judgeLanguage: string;
    problemCode: string;
    userId: string;
    code: string;
    createdAt: Date;
  },
) {
  const record = await ctx.prisma.practiceRunRecord.create({
    data: {
      sessionId: args.sessionId,
      isSubmit: args.isSubmit,
      language: args.codingLanguage,
      code: args.code,
      verdict: "Pending",
      compilePassed: false,
      createdAt: args.createdAt,
    },
  });

  let judgeReachable = true;
  try {
    await fetch(`${JUDGE_URL}/judge_submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sid: args.userId,
        pid: args.problemCode,
        language: args.judgeLanguage,
        connection_id: record.id,
        submission: args.code,
      }),
    });
  } catch {
    judgeReachable = false;
    await ctx.prisma.practiceRunRecord.update({
      where: { id: record.id },
      data: { verdict: "Judge Unreachable" },
    });
  }

  let finalRecord = record;
  if (judgeReachable) {
    const MAX_POLLS = 30;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updated = await ctx.prisma.practiceRunRecord.findUnique({
        where: { id: record.id },
      });
      if (updated && updated.verdict !== "Pending") {
        finalRecord = updated;
        break;
      }
    }
    if (finalRecord.verdict === "Pending") {
      await ctx.prisma.practiceRunRecord.update({
        where: { id: record.id },
        data: { verdict: "Timed Out" },
      });
      finalRecord = { ...finalRecord, verdict: "Timed Out" };
    }
  }

  if (args.isSubmit && finalRecord.verdict === "Accepted") {
    await ctx.prisma.practiceSession.updateMany({
      where: { id: args.sessionId, solvedAt: null },
      data: { solvedAt: args.createdAt },
    });
  }

  return finalRecord;
}

// ---------------------------------------------------------------------------
// Execution router — mutations for session tracking and code judging
// ---------------------------------------------------------------------------

export const practiceExecutionRouter = router({
  openSession: studentProcedure
    .input(z.object({ problemCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const problem = await getProblemByCode(ctx, input.problemCode);

      const session = await ctx.prisma.practiceSession.upsert({
        where: { userId_problemId: { userId: dbUser.id, problemId: problem.id } },
        create: { userId: dbUser.id, problemId: problem.id },
        update: {},
      });

      return {
        sessionId: session.id,
        problemId: session.problemId,
        startedAt: session.startedAt,
        firstRunAt: session.firstRunAt,
        firstSubmitAt: session.firstSubmitAt,
      };
    }),

  runCode: studentProcedure
    .input(practiceExecutionInput.extend({ isSubmit: z.literal(false) }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const session = await getPracticeSession(ctx, dbUser.id, input.sessionId, input.problemId);
      const codingLanguage = appLanguageToCodingLanguage(input.language);
      const judgeLanguage = appLanguageToJudgeLanguage(input.language);

      if (!codingLanguage || !judgeLanguage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported language" });
      }

      const updatedSession = await ctx.prisma.practiceSession.update({
        where: { id: session.id },
        data: {
          firstRunAt: session.firstRunAt ?? input.timestamp,
          selectedLang: codingLanguage,
          runCount: { increment: 1 },
        },
      });

      const finalRecord = await judgePracticeRecord(ctx, {
        sessionId: session.id,
        isSubmit: false,
        codingLanguage,
        judgeLanguage,
        problemCode: session.problem.code,
        userId: dbUser.id,
        code: input.code,
        createdAt: input.timestamp,
      });

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
    .input(practiceExecutionInput.extend({ isSubmit: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const session = await getPracticeSession(ctx, dbUser.id, input.sessionId, input.problemId);
      const codingLanguage = appLanguageToCodingLanguage(input.language);
      const judgeLanguage = appLanguageToJudgeLanguage(input.language);

      if (!codingLanguage || !judgeLanguage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported language" });
      }

      const updatedSession = await ctx.prisma.practiceSession.update({
        where: { id: session.id },
        data: {
          firstSubmitAt: session.firstSubmitAt ?? input.timestamp,
          submitCount: { increment: 1 },
          selectedLang: codingLanguage,
        },
      });

      const finalRecord = await judgePracticeRecord(ctx, {
        sessionId: session.id,
        isSubmit: true,
        codingLanguage,
        judgeLanguage,
        problemCode: session.problem.code,
        userId: dbUser.id,
        code: input.code,
        createdAt: input.timestamp,
      });

      return {
        firstSubmitAt: updatedSession.firstSubmitAt,
        solvedAt:
          finalRecord.verdict === "Accepted"
            ? (session.solvedAt ?? input.timestamp)
            : session.solvedAt,
        submitCount: updatedSession.submitCount,
        verdict: finalRecord.verdict,
        compilePassed: finalRecord.compilePassed,
        stdout: finalRecord.stdout,
        stderr: finalRecord.stderr,
        runtimeMs: finalRecord.runtimeMs,
        record: {
          id: finalRecord.id,
          verdict: finalRecord.verdict,
          createdAt: finalRecord.createdAt,
        },
      };
    }),
});
