import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { can, normalizeRole } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import path from "path";
import { promises as fs } from "fs";
import {
  appLanguageToCodingLanguage,
  appLanguageToJudgeLanguage,
  codingLanguageToLabel,
} from "@/server/coding-language";
import { applyContestJudgeResult } from "@/server/contestJudging";
import {
  normalizeJudgeStatusToSubmissionStatus,
  parseJudgeResult,
} from "@/server/judge";

interface SubmitCodeBody {
  language?: string;
  connection_id?: string;
  textcode?: string;
  code?: string;
}

interface JudgeSubmissionResponse {
  score?: number;
  Score?: number;
  status?: string;
  Status?: string;
  judge_output?: string;
  runtime?: string | number;
  runtime_ms?: string | number;
  memory?: string | number;
  memory_kb?: string | number;
  memory_mb?: string | number;
}

interface JudgeProblemMapping {
  id: string;
  code: string;
  judgeProblemId: string | null;
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

function looksLikeJudgeProblemId(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d+$/.test(value.trim());
}

function resolveJudgeProblemId(problem: JudgeProblemMapping): string | null {
  if (looksLikeJudgeProblemId(problem.judgeProblemId)) {
    return problem.judgeProblemId.trim();
  }

  if (looksLikeJudgeProblemId(problem.code)) {
    return problem.code.trim();
  }

  return null;
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
  const normalizedRole = normalizeRole(role);
  if (normalizedRole && can(normalizedRole).canManageContest) {
    return dbHelpers.findContest(contestId);
  }

  return dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant");
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

    const problem = await dbHelpers.findProblem(pid);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const judgeProblemId = resolveJudgeProblemId(problem);
    if (!judgeProblemId) {
      return NextResponse.json(
        {
          error:
            "This contest problem is missing a Judge problem mapping. Configure judgeProblemId (for example, 1036) before submitting.",
          details: {
            localProblemId: problem.id,
            problemCode: problem.code,
            judgeProblemId: problem.judgeProblemId,
          },
        },
        { status: 409 },
      );
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

    const JUDGE_URL = process.env.JUDGE_URL || "http://127.0.0.1:8000";
    let judgeResponse: JudgeSubmissionResponse;
    try {
      const judgeConnectionId = connection_id || submission.id;
      const response = await fetch(`${JUDGE_URL}/judge_submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: submission.id,
          pid: judgeProblemId,
          language: judgeLanguage,
          connection_id: judgeConnectionId,
          submission: code,
        }),
      });
      console.info("[contest-submit] forwarding to judge", {
        submissionId: submission.id,
        contestId: cid,
        localProblemId: pid,
        localProblemCode: problem.code,
        mappedJudgeProblemId: judgeProblemId,
        language: judgeLanguage,
      });
      judgeResponse = (await response.json()) as JudgeSubmissionResponse;

      if (!response.ok) {
        return NextResponse.json(
          {
            error: "Judge rejected submission",
            details: getErrorMessage(judgeResponse),
          },
          { status: response.status },
        );
      }
    } catch (error: unknown) {
      console.error("Judge request failed:", error);
      return NextResponse.json({ error: "Failed to reach judge", details: getErrorMessage(error) }, { status: 500 });
    }

    const normalizedJudgeResult = parseJudgeResult(judgeResponse);
    const settledSubmission =
      await applyContestJudgeResult({
        submissionId: submission.id,
        status: normalizedJudgeResult.status,
        score: normalizedJudgeResult.score,
        judgeOutput: normalizedJudgeResult.judgeOutput,
      });
    const submissionStatus =
      settledSubmission?.submissionStatus ??
      normalizeJudgeStatusToSubmissionStatus(
        normalizedJudgeResult.status,
        normalizedJudgeResult.score,
      );
    const score = settledSubmission?.score ?? normalizedJudgeResult.score;
    const judgeOutput = normalizedJudgeResult.judgeOutput;

    return NextResponse.json({
      message:
        submissionStatus === "PENDING"
          ? "Submission queued for judging"
          : "Submission received",
      sid: submission.id,
      score,
      status: submissionStatus,
      runtime: formatRuntimeFromJudgeResponse(judgeResponse, judgeOutput),
      memory: formatMemoryFromJudgeResponse(judgeResponse, judgeOutput),
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
