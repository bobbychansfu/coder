import type { Prisma, SubmissionStatus } from "@prisma/client";
import { parseAppLanguage } from "@/server/coding-language";

export interface JudgeQueueAcknowledgement {
  Status?: string;
  status?: string;
}

export interface JudgeCallbackPayload {
  sid: string;
  score?: number;
  status?: string;
  judge_output?: string;
  connection_id?: string;
  [key: string]: unknown;
}

export function resolveContestJudgeProblemId(problem: { id: string; code: string }): string | null {
  void problem;
  return "1036";
}

export function getContestJudgeLanguage(language: string): "Python3" | null {
  return parseAppLanguage(language) === "python" ? "Python3" : null;
}

export function readJudgeQueueStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const status = (payload as JudgeQueueAcknowledgement).Status ?? (payload as JudgeQueueAcknowledgement).status;
  return typeof status === "string" && status.trim().length > 0 ? status.trim() : null;
}

export function isJudgeQueueAcknowledgement(payload: unknown): boolean {
  const status = readJudgeQueueStatus(payload);
  return status?.toLowerCase() === "in queue";
}

export function normalizeContestJudgeStatus(status: string | null | undefined): SubmissionStatus {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case "AC":
    case "ACCEPTED":
      return "ACCEPTED";
    case "WA":
    case "WRONG_ANSWER":
    case "WRONG ANSWER":
      return "WRONG_ANSWER";
    case "TLE":
    case "TIME_LIMIT_EXCEEDED":
    case "TIME LIMIT EXCEEDED":
      return "TIME_LIMIT_EXCEEDED";
    case "PENDING":
    case "QUEUED":
    case "RUNNING":
      return "PENDING";
    case "MLE":
    case "MEMORY_LIMIT_EXCEEDED":
    case "MEMORY LIMIT EXCEEDED":
      return "MEMORY_LIMIT_EXCEEDED";
    case "ERR":
    case "RE":
    case "RUNTIME_ERROR":
    case "RUNTIME ERROR":
      return "RUNTIME_ERROR";
    case "CERR":
    case "CE":
    case "COMPILATION_ERROR":
    case "COMPILATION ERROR":
    case "COMPILE_ERROR":
    case "COMPILE ERROR":
      return "COMPILATION_ERROR";
    case "IERR":
    case "SYSTEM_ERROR":
    case "SYSTEM ERROR":
    case "INTERNALERROR":
    case "INTERNAL ERROR":
      return "SYSTEM_ERROR";
    default:
      return "SYSTEM_ERROR";
  }
}

export function normalizeJudgeScore(score: unknown): number {
  return typeof score === "number" && Number.isFinite(score) ? score : 0;
}

export function judgePayloadToJsonValue(payload: JudgeCallbackPayload): Prisma.InputJsonValue {
  return payload as unknown as Prisma.InputJsonValue;
}

function normalizePolledJudgeResult(value: unknown): JudgeCallbackPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const sid = typeof row.sid === "string" ? row.sid : typeof row.id === "string" ? row.id : null;
  if (!sid) {
    return null;
  }

  const status =
    typeof row.status === "string"
      ? row.status
      : typeof row.Status === "string"
        ? row.Status
        : undefined;

  const judge_output =
    typeof row.judge_output === "string"
      ? row.judge_output
      : typeof row.output === "string"
        ? row.output
        : undefined;

  const score = typeof row.score === "number" ? row.score : undefined;
  const connection_id = typeof row.connection_id === "string" ? row.connection_id : undefined;

  return {
    ...row,
    sid,
    status,
    judge_output,
    score,
    connection_id,
  };
}

export function extractJudgePolledResults(payload: unknown): JudgeCallbackPayload[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? [
          (payload as Record<string, unknown>).submissions,
          (payload as Record<string, unknown>).results,
          (payload as Record<string, unknown>).data,
        ].find(Array.isArray) ?? []
      : [];

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.map(normalizePolledJudgeResult).filter((value): value is JudgeCallbackPayload => value !== null);
}
