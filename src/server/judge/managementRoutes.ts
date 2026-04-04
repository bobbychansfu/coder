import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { dbHelpers } from "@/lib/db-helpers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  judgePayloadToJsonValue,
  normalizeContestJudgeStatus,
  normalizeJudgeScore,
  type JudgeCallbackPayload,
} from "@/server/judge/contestJudge";

const PRACTICE_STATUS_MAP: Record<string, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  CE: "Compile Error",
  CERR: "Compile Error",
  RE: "Runtime Error",
  ERR: "Runtime Error",
  MLE: "Memory Limit Exceeded",
  IERR: "Internal Error",
  InternalError: "Internal Error",
};

export async function handleJudgeResultCallback(req: NextRequest) {
  try {
    const body = (await req.json()) as JudgeCallbackPayload;
    const normalizedStatus = normalizeContestJudgeStatus(body.status);
    const normalizedScore = normalizeJudgeScore(body.score);
    const judgeOutput = typeof body.judge_output === "string" ? body.judge_output : "";

    const submission = body.sid ? await dbHelpers.findSubmissionWithRelations(body.sid) : null;
    if (submission) {
      await dbHelpers.updateSubmission(submission.id, {
        status: normalizedStatus,
        score: normalizedScore,
        judgeOutput,
        judgeStatusRaw: body.status ?? null,
        judgeCallbackPayload: judgePayloadToJsonValue(body),
      });

      await prisma.problemStatus.upsert({
        where: {
          userId_contestId_problemId: {
            userId: submission.userId,
            contestId: submission.contestId,
            problemId: submission.problemId,
          },
        },
        update: {
          status: normalizedStatus === "ACCEPTED" ? "correct" : "wrong",
          score: normalizedStatus === "ACCEPTED" ? normalizedScore : 0,
        },
        create: {
          userId: submission.userId,
          contestId: submission.contestId,
          problemId: submission.problemId,
          status: normalizedStatus === "ACCEPTED" ? "correct" : "wrong",
          score: normalizedStatus === "ACCEPTED" ? normalizedScore : 0,
        },
      });

      return NextResponse.json({
        ok: true,
        target: "contest",
        sid: submission.id,
        status: normalizedStatus,
      });
    }

    const { status, judge_output, connection_id } = body;
    if (connection_id) {
      const verdict = PRACTICE_STATUS_MAP[status ?? ""] ?? status;
      const compilePassed = status === "AC" || status === "WA" || status === "TLE";

      await prisma.practiceRunRecord.update({
        where: { id: connection_id },
        data: {
          verdict,
          compilePassed,
          stdout: judge_output || null,
          runtimeMs: normalizedScore ?? null,
          rawProviderResponse: body as unknown as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json({ ok: true, target: "practice", sid: body.sid ?? null });
    }

    return NextResponse.json({ ok: false, error: "Unknown sid" }, { status: 404 });
  } catch (err) {
    console.error("[judge-callback] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function handleJudgeSubmissionStatuses(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sids = req.nextUrl.searchParams.get("sids");
  if (!sids) {
    return NextResponse.json({ error: "sids query parameter is required" }, { status: 400 });
  }

  const submissionIds = sids
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (submissionIds.length === 0) {
    return NextResponse.json({ error: "At least one sid is required" }, { status: 400 });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      id: { in: submissionIds },
      user: { computingId: user.computingId },
    },
    select: {
      id: true,
      status: true,
      score: true,
      judgeOutput: true,
      judgeStatusRaw: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const submissionMap = Object.fromEntries(
    submissions.map((submission) => [
      submission.id,
      {
        status: submission.status,
        score: submission.score,
        judge_output: submission.judgeOutput,
        judge_status_raw: submission.judgeStatusRaw,
        created_at: submission.createdAt.toISOString(),
        updated_at: submission.updatedAt.toISOString(),
      },
    ]),
  );

  return NextResponse.json(submissionMap);
}
