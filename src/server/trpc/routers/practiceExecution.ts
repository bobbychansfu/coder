import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";
import {
  APP_LANGUAGES,
  appLanguageToCodingLanguage,
} from "../../coding-language";
import { getDbUser, getProblemByCode, type PrismaClient } from "./practice";
import { createPracticeSubmission } from "@/server/practice/submissionService";

// ---------------------------------------------------------------------------
// Input schema for the single practice submit/judge action
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

  submitCode: studentProcedure
    .input(practiceExecutionInput)
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUser(ctx);
      const session = await getPracticeSession(ctx, dbUser.id, input.sessionId, input.problemId);
      const codingLanguage = appLanguageToCodingLanguage(input.language);

      if (!codingLanguage) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported language" });
      }

      const queuedRecord = await createPracticeSubmission({
        userId: dbUser.id,
        problemId: session.problemId,
        language: input.language,
        code: input.code,
        createdAt: input.timestamp,
      });

      const updatedSession = await ctx.prisma.practiceSession.findUnique({
        where: { id: session.id },
        select: {
          firstSubmitAt: true,
          solvedAt: true,
          submitCount: true,
        },
      });

      return {
        firstSubmitAt: updatedSession?.firstSubmitAt ?? session.firstSubmitAt,
        solvedAt: updatedSession?.solvedAt ?? session.solvedAt,
        submitCount: updatedSession?.submitCount ?? session.submitCount,
        verdict: queuedRecord.verdict,
        compilePassed: queuedRecord.compilePassed,
        stdout: queuedRecord.stdout,
        stderr: queuedRecord.stderr,
        runtimeMs: queuedRecord.runtimeMs,
        record: {
          id: queuedRecord.id,
          verdict: queuedRecord.verdict,
          createdAt: queuedRecord.createdAt,
        },
      };
    }),
});
