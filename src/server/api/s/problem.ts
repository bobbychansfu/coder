import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import { syncStudentGamification } from "@/server/gamification/persistence";
import path from "path";
import { promises as fs } from "fs";
import {
  appLanguageToCodingLanguage,
  appLanguageToJudgeLanguage,
  codingLanguageToLabel,
} from "@/server/coding-language";
import { SubmissionStatus } from "@prisma/client";

interface SubmitCodeBody {
  language?: string;
  connection_id?: string;
  textcode?: string;
  code?: string;
}

interface JudgeSubmissionResponse {
  score?: number;
  status?: string;
  judge_output?: string;
  runtime?: string | number;
  runtime_ms?: string | number;
  memory?: string | number;
  memory_kb?: string | number;
  memory_mb?: string | number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function normalizeJudgeStatusToSubmissionStatus(
  status: string | null | undefined,
  score: number,
): SubmissionStatus {
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
    case "RE":
    case "ERR":
    case "RUNTIME_ERROR":
    case "RUNTIME ERROR":
    case "IERR":
    case "INTERNALERROR":
    case "INTERNAL ERROR":
      return "RUNTIME_ERROR";
    case "CE":
    case "CERR":
    case "COMPILE_ERROR":
    case "COMPILE ERROR":
      return "COMPILE_ERROR";
    case "PENDING":
    case "QUEUED":
    case "RUNNING":
      return "PENDING";
    default:
      return score > 0 ? "ACCEPTED" : "WRONG_ANSWER";
  }
}

function parseMetricValue(
  judgeOutput: string | null | undefined,
  patterns: RegExp[],
): string | null {
  if (!judgeOutput) {
    return null;
  }

  for (const pattern of patterns) {
    const match = judgeOutput.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function formatRuntimeFromJudgeResponse(result: JudgeSubmissionResponse, judgeOutput: string | null) {
  const runtimeMs = result.runtime_ms ?? result.runtime;
  if (typeof runtimeMs === "number") {
    return `${runtimeMs}ms`;
  }

  if (typeof runtimeMs === "string" && runtimeMs.trim().length > 0) {
    return runtimeMs.trim();
  }

  return (
    parseMetricValue(judgeOutput, [
      /runtime\s*[:=]\s*([^\n,;]+)/i,
      /time\s*[:=]\s*([^\n,;]+)/i,
    ]) ?? "-"
  );
}

function formatMemoryFromJudgeResponse(result: JudgeSubmissionResponse, judgeOutput: string | null) {
  if (typeof result.memory_mb === "number") {
    return `${result.memory_mb}MB`;
  }

  if (typeof result.memory_kb === "number") {
    return `${result.memory_kb}KB`;
  }

  if (typeof result.memory === "number") {
    return `${result.memory}`;
  }

  if (typeof result.memory === "string" && result.memory.trim().length > 0) {
    return result.memory.trim();
  }

  return (
    parseMetricValue(judgeOutput, [
      /memory\s*[:=]\s*([^\n,;]+)/i,
      /mem\s*[:=]\s*([^\n,;]+)/i,
    ]) ?? "-"
  );
}

export async function handleGetProblemDetails(
  _request: NextRequest,
  cid: string,
  pid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;
    const role = user.role;

    if (!/^[a-zA-Z0-9_-]+$/.test(pid)) {
      return NextResponse.json({ error: "Invalid problem ID" }, { status: 400 });
    }

    const problem = await dbHelpers.findProblemWithDetails(pid);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    
    const basePath = path.join(process.cwd(), "src", "server", "sfu_judge_problems", pid);
    const htmlPath = path.join(basePath, "problem.html");
    const downloadPath = path.join(basePath, "downloads");

    let downloadContents: string[] = [];
    let htmlContents: string | string[] = "";

    try {
      htmlContents = await fs.readFile(htmlPath, "utf8");
    } catch (error: unknown) {
      htmlContents = [];
      console.warn(`Problem HTML not found: ${getErrorMessage(error)}`);
    }

    try {
      downloadContents = (await fs.readdir(downloadPath)).filter(
        (string) => string[0] !== "."
      );
    } catch {
      downloadContents = [];
    }

    await dbHelpers.createProblemStatus(computingId, cid, pid);

    return NextResponse.json({
      computingId,
      cid,
      problem,
      downloadContents,
      pid,
      role,
      htmlContents,
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function handleSubmitCode(
  request: NextRequest,
  cid: string,
  pid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;

    let language: string = "";
    let connection_id: string = "";
    let code: string = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      language = (formData.get("language") as string) || "";
      connection_id = (formData.get("connection_id") as string) || "";
      const file = formData.get("filecode") as File;
      if (file) {
        code = await file.text();
      } else {
        code = (formData.get("textcode") as string) || "";
      }
    } else {
      const body = (await request.json()) as SubmitCodeBody;
      language = body.language || "";
      connection_id = body.connection_id || "";
      code = body.textcode || body.code || "";
    }

    if (!code) {
      return NextResponse.json({ error: "No code submitted" }, { status: 400 });
    }

    const contest = await dbHelpers.findSpecificContestForUser(computingId, cid, "contestant");
    if (!contest) {
      return NextResponse.json({ error: "Not registered for contest" }, { status: 403 });
    }

    await dbHelpers.createProblemStatus(computingId, cid, pid);

    const codingLanguage = appLanguageToCodingLanguage(language);
    const judgeLanguage = appLanguageToJudgeLanguage(language);

    if (!codingLanguage || !judgeLanguage) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    const submission = await dbHelpers.createSubmission({
      computingId,
      contestId: cid,
      problemId: pid,
      submission: code,
      language: codingLanguage,
    });

    const now = new Date();
    const endsAt = contest.endsAt ? new Date(contest.endsAt) : null;

    const JUDGE_URL = process.env.JUDGE_URL || "http://127.0.0.1:8000";
    let judgeResponse: JudgeSubmissionResponse;
    try {
      const response = await fetch(`${JUDGE_URL}/judge_submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: submission.id,
          pid,
          language: judgeLanguage,
          connection_id,
          submission: code,
        }),
      });
      judgeResponse = await response.json();
    } catch (error: unknown) {
      console.error("Judge request failed:", error);
      return NextResponse.json({ error: "Failed to reach judge", details: getErrorMessage(error) }, { status: 500 });
    }

    const problem = await dbHelpers.findProblem(pid);
    const score = judgeResponse.score || 0;
    const judgeOutput = judgeResponse.judge_output?.trim() || "";
    const submissionStatus = normalizeJudgeStatusToSubmissionStatus(judgeResponse.status, score);

    await dbHelpers.updateSubmission(submission.id, submissionStatus, judgeOutput, score);
    await dbHelpers.updateProblemStatus(computingId, cid, pid, {
      status: submissionStatus === "ACCEPTED" ? "correct" : "wrong",
      score,
      tries: 1,
    });

    await dbHelpers.updateUserPointsAndProblems(computingId, score, score > 0 ? 1 : 0);
    if (problem) {
      await dbHelpers.addNewActivity(computingId, "submission", `Submitted a solution for ${problem.title} and received ${score} points`);
    }
    await syncStudentGamification(computingId);

    if (endsAt && endsAt < now) {
      return NextResponse.json({
        message: "Contest has ended, submission recorded",
        sid: submission.id,
        score,
        status: submissionStatus,
        runtime: formatRuntimeFromJudgeResponse(judgeResponse, judgeOutput),
        memory: formatMemoryFromJudgeResponse(judgeResponse, judgeOutput),
      });
    } else {
      return NextResponse.json({
        message: "Submission received",
        sid: submission.id,
        score,
        status: submissionStatus,
        runtime: formatRuntimeFromJudgeResponse(judgeResponse, judgeOutput),
        memory: formatMemoryFromJudgeResponse(judgeResponse, judgeOutput),
      });
    }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function handleGetSubmissionsForProblem(
  request: NextRequest,
  cid: string,
  pid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await dbHelpers.findSubmissionsForProblem(user.computingId, cid, pid);
    const problem = await dbHelpers.findProblem(pid);

    return NextResponse.json({
      computingId: user.computingId,
      submissions: subs.map((submission) => ({
        id: submission.id,
        status: submission.status,
        language: submission.language,
        languageLabel: codingLanguageToLabel(submission.language),
        createdAt: submission.createdAt.toISOString(),
        score: submission.score,
        runtime: formatRuntimeFromJudgeResponse({}, submission.judgeOutput),
        memory: formatMemoryFromJudgeResponse({}, submission.judgeOutput),
        judgeOutput: submission.judgeOutput ?? "",
      })),
      problem,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function handleGetAllSubmissions(request: NextRequest) {
  try {
    void request;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await dbHelpers.findAllSubmissions(user.computingId);

    return NextResponse.json({
      computingId: user.computingId,
      submissions: subs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
