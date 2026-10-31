import { NextRequest, NextResponse } from "next/server";
import { applyContestJudgeResult } from "@/server/contestJudging";
import { parseJudgeResult } from "@/server/judge";
import { applyPracticeJudgeResult } from "@/server/practice/submissionService";

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

    const found = await applyPracticeJudgeResult({
      submissionId: practiceSubmissionId,
      status: normalized.status,
      score: normalized.score,
      judgeOutput: normalized.judgeOutput,
    });

    if (!found) {
      console.warn("[judge-callback] no matching contest or practice submission found", callbackSummary);
      return NextResponse.json(
        { ok: false, error: "Submission not found" },
        { status: 404 },
      );
    }

    console.info("[judge-callback] practice submission updated", {
      ...callbackSummary,
      target: "practice",
    });

    return NextResponse.json({ ok: true, target: "practice" });
  } catch (err) {
    console.error("[judge-callback] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
