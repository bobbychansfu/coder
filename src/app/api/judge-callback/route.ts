import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Payload shape sent by the SFU judge after processing a submission
interface JudgeCallbackPayload {
  sid: string;
  score: number;
  status: string;       // "AC" | "WA" | "TLE" | "CE" | "RE" | "IERR" | "InternalError"
  judge_output: string;
  connection_id: string; // matches PracticeRunRecord.id
}

const STATUS_MAP: Record<string, string> = {
  AC: "Accepted",
  WA: "Wrong Answer",
  TLE: "Time Limit Exceeded",
  CE: "Compile Error",
  RE: "Runtime Error",
  ERR: "Runtime Error",
  IERR: "Internal Error",
  InternalError: "Internal Error",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JudgeCallbackPayload;
    const { status, judge_output, connection_id, score } = body;

    const verdict = STATUS_MAP[status] ?? status;
    // compile passed = made it past compilation (AC / WA / TLE are post-compile)
    const compilePassed = status === "AC" || status === "WA" || status === "TLE";

    const record = await prisma.practiceRunRecord.update({
      where: { id: connection_id },
      data: {
        verdict,
        compilePassed,
        stdout: judge_output || null,
        runtimeMs: score ?? null,
      },
      select: {
        isSubmit: true,
        createdAt: true,
        sessionId: true,
      },
    });

    if (record.isSubmit && verdict === "Accepted") {
      await prisma.practiceSession.updateMany({
        where: { id: record.sessionId, solvedAt: null },
        data: { solvedAt: record.createdAt },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[judge-callback] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
