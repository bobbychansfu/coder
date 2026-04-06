import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncStudentGamification } from "@/server/gamification/persistence";
import { normalizeJudgeStatusToSubmissionStatus } from "./judge";

interface ApplyContestJudgeResultArgs {
  submissionId: string;
  status: string | null | undefined;
  score: number;
  judgeOutput: string;
}

interface ContestJudgeUpdateResult {
  found: boolean;
  submissionStatus: SubmissionStatus;
  score: number;
}

export async function applyContestJudgeResult(
  args: ApplyContestJudgeResultArgs,
): Promise<ContestJudgeUpdateResult | null> {
  const nextStatus = normalizeJudgeStatusToSubmissionStatus(args.status, args.score);
  const nextScore = Math.max(0, Math.trunc(args.score));
  const nextJudgeOutput = args.judgeOutput.trim();

  const outcome = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: args.submissionId },
      include: {
        user: {
          select: {
            id: true,
            computingId: true,
          },
        },
        problem: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!submission) {
      return null;
    }

    const previousStatus = submission.status;
    const previousScore = submission.score;

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        status: nextStatus,
        judgeOutput: nextJudgeOutput,
        score: nextScore,
      },
    });

    const isSystemError = nextStatus === "SYSTEM_ERROR";
    const shouldApplyProblemStatus = nextStatus !== "PENDING" && !isSystemError;
    const shouldIncrementTries =
      previousStatus === "PENDING" && nextStatus !== "PENDING" && !isSystemError;
    const pointsDelta = Math.max(0, nextScore - previousScore);
    const problemsSolvedDelta = previousScore > 0 ? 0 : nextScore > 0 ? 1 : 0;

    if (shouldApplyProblemStatus) {
      await tx.problemStatus.upsert({
        where: {
          userId_contestId_problemId: {
            userId: submission.userId,
            contestId: submission.contestId,
            problemId: submission.problemId,
          },
        },
        update: {
          status: nextStatus === "ACCEPTED" ? "correct" : "wrong",
          score: nextScore,
          tries: shouldIncrementTries ? { increment: 1 } : undefined,
        },
        create: {
          userId: submission.userId,
          contestId: submission.contestId,
          problemId: submission.problemId,
          status: nextStatus === "ACCEPTED" ? "correct" : "wrong",
          score: nextScore,
          tries: shouldIncrementTries ? 1 : 0,
        },
      });
    }

    if (pointsDelta > 0 || problemsSolvedDelta > 0) {
      await tx.user.update({
        where: { id: submission.user.id },
        data: {
          pointsAcquired: { increment: pointsDelta },
          problemsSolved: { increment: problemsSolvedDelta },
        },
      });
    }

    if (shouldIncrementTries && submission.problem?.title) {
      await tx.userActivity.create({
        data: {
          userId: submission.user.id,
          type: "submission",
          name: `Submitted a solution for ${submission.problem.title} and received ${nextScore} points`,
        },
      });
    }

    return {
      computingId: submission.user.computingId,
      shouldSyncGamification:
        shouldIncrementTries || pointsDelta > 0 || problemsSolvedDelta > 0,
      submissionStatus: nextStatus,
      score: nextScore,
    };
  });

  if (!outcome) {
    return null;
  }

  if (outcome.shouldSyncGamification) {
    await syncStudentGamification(outcome.computingId);
  }

  return {
    found: true,
    submissionStatus: outcome.submissionStatus,
    score: outcome.score,
  };
}
