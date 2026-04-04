import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import path from "path";
import { promises as fs } from "fs";
import {
  appLanguageToCodingLanguage,
  codingLanguageToLabel,
} from "@/server/coding-language";
import {
  getContestJudgeLanguage,
  isJudgeQueueAcknowledgement,
  normalizeContestJudgeStatus,
  readJudgeQueueStatus,
  resolveContestJudgeProblemId,
} from "@/server/judge/contestJudge";

interface SubmitCodeBody {
  language?: string;
  connection_id?: string;
  textcode?: string;
  code?: string;
}

interface JudgeSubmissionResponse {
  runtime?: string | number;
  runtime_ms?: string | number;
  memory?: string | number;
  memory_kb?: string | number;
  memory_mb?: string | number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
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

function isContestViewableByRegisteredUser(contest: { published: boolean; status: string }) {
  return contest.published && contest.status !== "DRAFT";
}

function isContestOpenForSubmission(
  contest: { published: boolean; status: string; startsAt: Date; endsAt: Date | null },
) {
  if (!isContestViewableByRegisteredUser(contest) || contest.status !== "ACTIVE") {
    return false;
  }

  const now = new Date();

  if (contest.startsAt > now) {
    return false;
  }

  if (contest.endsAt && contest.endsAt <= now) {
    return false;
  }

  return true;
}

async function findContestForViewer(computingId: string, role: string, contestId: string) {
  if (can(role as "student" | "ta" | "instructor" | "admin").canManageContest) {
    return dbHelpers.findContest(contestId);
  }

  return dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant");
}

async function syncPendingContestSubmissionsFromJudge(args: {
  computingId: string;
  contestId: string;
  problemId: string;
}) {
  return dbHelpers.findSubmissionsForProblem(
    args.computingId,
    args.contestId,
    args.problemId,
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

    const contest = await findContestForViewer(computingId, role, cid);

    if (!contest) {
      return NextResponse.json(
        { error: can(role).canManageContest ? "Contest not found" : "Not registered for contest" },
        { status: can(role).canManageContest ? 404 : 403 },
      );
    }

    if (!isContestViewableByRegisteredUser(contest)) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
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
    const role = user.role;

    if (can(role).canManageContest) {
      return NextResponse.json({ error: "Only student participants can submit" }, { status: 403 });
    }

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

    const contest = await findContestForViewer(computingId, role, cid);
    if (!contest) {
      return NextResponse.json({ error: "Not registered for contest" }, { status: 403 });
    }

    if (!isContestViewableByRegisteredUser(contest)) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (!isContestOpenForSubmission(contest)) {
      return NextResponse.json(
        {
          error:
            contest.status === "ENDED" || (contest.endsAt && contest.endsAt <= new Date())
              ? "Contest has ended"
              : "Contest is not accepting submissions",
        },
        { status: 403 },
      );
    }

    await dbHelpers.createProblemStatus(computingId, cid, pid);

    const codingLanguage = appLanguageToCodingLanguage(language);
    const judgeLanguage = getContestJudgeLanguage(language);

    if (!codingLanguage) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    const submission = await dbHelpers.createSubmission({
      computingId,
      contestId: cid,
      problemId: pid,
      submission: code,
      language: codingLanguage,
    });

    await dbHelpers.updateProblemStatus(computingId, cid, pid, {
      tries: 1,
    });

    const problem = await dbHelpers.findProblem(pid);
    if (!problem) {
      await dbHelpers.updateSubmission(submission.id, {
        status: "SYSTEM_ERROR",
        judgeOutput: "Problem not found locally while preparing Judge submission.",
        score: 0,
        judgeStatusRaw: "LOCAL_PROBLEM_NOT_FOUND",
      });
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const judgeProblemId = resolveContestJudgeProblemId(problem);
    if (!judgeProblemId) {
      await dbHelpers.updateSubmission(submission.id, {
        status: "SYSTEM_ERROR",
        judgeOutput: `No verified Judge mapping is configured for local problem code "${problem.code}".`,
        score: 0,
        judgeStatusRaw: "UNMAPPED_JUDGE_PROBLEM",
      });
      return NextResponse.json(
        { error: "This contest problem is not wired to the external Judge yet." },
        { status: 400 },
      );
    }

    if (!judgeLanguage) {
      await dbHelpers.updateSubmission(submission.id, {
        status: "SYSTEM_ERROR",
        judgeOutput: "The verified SFU Judge integration currently supports Python submissions only.",
        score: 0,
        judgeStatusRaw: "UNSUPPORTED_JUDGE_LANGUAGE",
      });
      return NextResponse.json(
        { error: "The verified SFU Judge integration currently supports Python submissions only." },
        { status: 400 },
      );
    }

    const JUDGE_URL = process.env.JUDGE_URL || "http://127.0.0.1:8000";
    let judgeResponse: unknown;
    let judgeResponseText = "";
    try {
      const response = await fetch(`${JUDGE_URL}/judge_submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: submission.id,
          pid: judgeProblemId,
          cid,
          language: judgeLanguage,
          connection_id: connection_id || "",
          submission: code,
        }),
      });

      judgeResponseText = await response.text();
      try {
        judgeResponse = judgeResponseText ? JSON.parse(judgeResponseText) : null;
      } catch {
        judgeResponse = judgeResponseText;
      }

      if (!response.ok) {
        await dbHelpers.updateSubmission(submission.id, {
          status: "SYSTEM_ERROR",
          judgeOutput: judgeResponseText || `Judge returned HTTP ${response.status}.`,
          score: 0,
          judgeStatusRaw: `HTTP_${response.status}`,
        });
        return NextResponse.json(
          { error: "Judge rejected the submission.", details: judgeResponseText || response.statusText },
          { status: 502 },
        );
      }
    } catch (error: unknown) {
      console.error("Judge request failed:", error);
      await dbHelpers.updateSubmission(submission.id, {
        status: "SYSTEM_ERROR",
        judgeOutput: getErrorMessage(error),
        score: 0,
        judgeStatusRaw: "JUDGE_REQUEST_FAILED",
      });
      return NextResponse.json({ error: "Failed to reach judge", details: getErrorMessage(error) }, { status: 500 });
    }

    if (!isJudgeQueueAcknowledgement(judgeResponse)) {
      await dbHelpers.updateSubmission(submission.id, {
        status: "SYSTEM_ERROR",
        judgeOutput: judgeResponseText || "Judge did not acknowledge the submission queue request.",
        score: 0,
        judgeStatusRaw: readJudgeQueueStatus(judgeResponse) ?? "UNEXPECTED_QUEUE_RESPONSE",
      });
      return NextResponse.json(
        { error: "Judge did not acknowledge the submission queue request.", details: judgeResponse ?? null },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Submission queued for judging.",
      sid: submission.id,
      status: "PENDING",
      queueStatus: readJudgeQueueStatus(judgeResponse),
    });
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

    const contest = await findContestForViewer(user.computingId, user.role, cid);

    if (!contest) {
      return NextResponse.json(
        {
          error: can(user.role).canManageContest ? "Contest not found" : "Not registered for contest",
        },
        { status: can(user.role).canManageContest ? 404 : 403 },
      );
    }

    if (!isContestViewableByRegisteredUser(contest)) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const subs = await syncPendingContestSubmissionsFromJudge({
      computingId: user.computingId,
      contestId: cid,
      problemId: pid,
    });
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
