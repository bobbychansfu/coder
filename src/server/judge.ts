import { SubmissionStatus } from "@prisma/client";

type JudgeResultLike = {
  sid?: unknown;
  status?: unknown;
  Status?: unknown;
  score?: unknown;
  Score?: unknown;
  judge_output?: unknown;
  judgeOutput?: unknown;
  connection_id?: unknown;
  connectionId?: unknown;
};

export interface NormalizedJudgeResult {
  sid: string | null;
  status: string | null;
  score: number;
  judgeOutput: string;
  connectionId: string | null;
}

function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toNonNegativeInteger(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.trunc(parsed));
    }
  }

  return 0;
}

export function parseJudgeResult(payload: JudgeResultLike): NormalizedJudgeResult {
  return {
    sid: toOptionalString(payload.sid),
    status: toOptionalString(payload.status) ?? toOptionalString(payload.Status),
    score: toNonNegativeInteger(payload.score ?? payload.Score),
    judgeOutput:
      toOptionalString(payload.judge_output) ??
      toOptionalString(payload.judgeOutput) ??
      "",
    connectionId:
      toOptionalString(payload.connection_id) ?? toOptionalString(payload.connectionId),
  };
}

export interface JudgeProblemSample {
  input: string;
  output: string;
}

export interface JudgeProblemFiles {
  timeSec: number;
  memMb: number;
  samples: JudgeProblemSample[];
}

// Limits and samples are read from the judge's own problem folder, so the
// problem page shows exactly what the judge enforces and runs.
export async function fetchJudgeProblemFiles(
  judgeProblemId: string,
): Promise<JudgeProblemFiles | null> {
  const judgeUrl = (process.env.JUDGE_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

  try {
    const response = await fetch(`${judgeUrl}/problems/${encodeURIComponent(judgeProblemId)}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      time_sec?: unknown;
      mem_MB?: unknown;
      samples?: unknown;
    };
    const samples: unknown[] = Array.isArray(payload.samples) ? payload.samples : [];

    return {
      timeSec: toNonNegativeInteger(payload.time_sec),
      memMb: toNonNegativeInteger(payload.mem_MB),
      samples: samples.flatMap((sample) => {
        const { input, output } = (sample ?? {}) as { input?: unknown; output?: unknown };
        return typeof input === "string" && typeof output === "string" ? [{ input, output }] : [];
      }),
    };
  } catch (error) {
    console.warn("[judge] could not load problem files", { judgeProblemId, error });
    return null;
  }
}

export function normalizeJudgeStatusToSubmissionStatus(
  status: string | null | undefined,
  score: number,
): SubmissionStatus {
  const normalized = status?.trim().toUpperCase().replace(/\s+/g, "_");

  switch (normalized) {
    case "AC":
    case "ACCEPTED":
      return "ACCEPTED";
    case "WA":
    case "WRONG_ANSWER":
      return "WRONG_ANSWER";
    case "TLE":
    case "TIME_LIMIT_EXCEEDED":
      return "TIME_LIMIT_EXCEEDED";
    case "RE":
    case "ERR":
    case "RUNTIME_ERROR":
      return "RUNTIME_ERROR";
    case "IERR":
    case "INTERNALERROR":
    case "INTERNAL_ERROR":
      return "SYSTEM_ERROR";
    case "CE":
    case "CERR":
    case "COMPILE_ERROR":
      return "COMPILE_ERROR";
    case "PENDING":
    case "QUEUED":
    case "IN_QUEUE":
    case "RUNNING":
      return "PENDING";
    default:
      return score > 0 ? "ACCEPTED" : "WRONG_ANSWER";
  }
}
