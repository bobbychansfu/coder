import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyContestJudgeResult } from "@/server/contestJudging";
import { parseJudgeResult } from "@/server/judge";
import { publishPracticeSubmissionEvent } from "@/server/practice/submissionService";

const STATUS_MAP: Record<string, string> = {
  AC: "Accepted",
  ACCEPTED: "Accepted",
  WA: "Wrong Answer",
  WRONG_ANSWER: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  CE: "Compile Error",
  COMPILE_ERROR: "Compile Error",
  RE: "Runtime Error",
  ERR: "Runtime Error",
  RUNTIME_ERROR: "Runtime Error",
  IERR: "System Error",
  INTERNALERROR: "System Error",
  INTERNAL_ERROR: "System Error",
};

interface JudgeResultPayload {
  sid: string;
  status: string;
  judge_output: string;
  score: number;
  connection_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JudgeResultPayload;
    const normalized = parseJudgeResult(body);
    const callbackSummary = {
      receivedAt: new Date().toISOString(),
      path: req.nextUrl.pathname,
      sid: normalized.sid,
      connectionId: normalized.connectionId,
      status: normalized.status,
      score: normalized.score,
      userAgent: req.headers.get("user-agent"),
      forwardedFor: req.headers.get("x-forwarded-for"),
    };

    console.info("[judge-callback] incoming", callbackSummary);

    if (normalized.sid) {
      const contestResult = await applyContestJudgeResult({
        submissionId: normalized.sid,
        status: normalized.status,
        score: normalized.score,
        judgeOutput: normalized.judgeOutput,
      });

      if (contestResult) {
        console.info("[judge-callback] contest submission updated", {
          ...callbackSummary,
          target: "contest",
          finalStatus: contestResult.submissionStatus,
        });
        return NextResponse.json({
          ok: true,
          target: "contest",
          status: contestResult.submissionStatus,
        });
      }
    }

    const practiceSubmissionId = normalized.connectionId ?? normalized.sid;
    if (!practiceSubmissionId) {
      console.warn("[judge-callback] missing identifiers", callbackSummary);
      return NextResponse.json(
        { ok: false, error: "Missing callback identifiers" },
        { status: 400 },
      );
    }

    const rawStatus = normalized.status?.trim().toUpperCase().replace(/\s+/g, "_") ?? "";
    const verdict = STATUS_MAP[rawStatus] ?? normalized.status ?? "Pending";
    const compilePassed =
      rawStatus === "AC" ||
      rawStatus === "ACCEPTED" ||
      rawStatus === "WA" ||
      rawStatus === "WRONG_ANSWER" ||
      rawStatus === "TLE" ||
      rawStatus === "TIME_LIMIT_EXCEEDED";

    const practiceRecord = await prisma.practiceRunRecord.findUnique({
      where: { id: practiceSubmissionId },
      select: { id: true },
    });

    if (!practiceRecord) {
      console.warn("[judge-callback] no matching contest or practice submission found", callbackSummary);
      return NextResponse.json(
        { ok: false, error: "Submission not found" },
        { status: 404 },
      );
    }

    await prisma.practiceRunRecord.update({
      where: { id: practiceSubmissionId },
      data: {
        status: "done",
        score: normalized.score,
        verdict,
        compilePassed,
        feedback: normalized.judgeOutput || null,
        stdout: normalized.judgeOutput || null,
        stderr: null,
        errorMessage: null,
        judgedBy: "judge",
        runtimeMs: normalized.score || null,
      },
    });
    await publishPracticeSubmissionEvent(practiceSubmissionId);

    console.info("[judge-callback] practice submission updated", {
      ...callbackSummary,
      target: "practice",
      finalStatus: verdict,
    });

    return NextResponse.json({ ok: true, target: "practice" });
  } catch (err) {
    console.error("[judge-callback] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
