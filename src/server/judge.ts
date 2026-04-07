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
