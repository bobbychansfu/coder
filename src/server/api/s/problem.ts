import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import path from "path";
import { promises as fs } from "fs";
import { appLanguageToCodingLanguage, appLanguageToJudgeLanguage } from "@/server/coding-language";
import { getJudgeUrl } from "@/server/judge-url";

export async function handleGetProblemDetails(
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

    if (!/^[a-zA-Z0-9_-]+$/.test(pid)) {
      return NextResponse.json({ error: "Invalid problem ID" }, { status: 400 });
    }

    const problem = await dbHelpers.findProblem(pid);
    
    const basePath = path.join(process.cwd(), "src", "server", "sfu_judge_problems", pid);
    const htmlPath = path.join(basePath, "problem.html");
    const downloadPath = path.join(basePath, "downloads");

    let downloadContents: string[] = [];
    let htmlContents: string | any[] = "";

    try {
      htmlContents = await fs.readFile(htmlPath, "utf8");
    } catch (err: any) {
      htmlContents = [];
      console.warn(`Problem HTML not found: ${err.message}`);
    }

    try {
      downloadContents = (await fs.readdir(downloadPath)).filter(
        (string) => string[0] !== "."
      );
    } catch (err) {
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
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
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
      const body = await request.json();
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

    const ps = await dbHelpers.findProblemStatus(computingId, cid, pid);

    const now = new Date();
    const endsAt = contest.endsAt ? new Date(contest.endsAt) : null;

    if (endsAt && endsAt < now && ps) {
      await dbHelpers.updateProblemStatus(computingId, cid, pid, {
        status: "judging",
        score: ps.score,
        tries: 1, // increment tries
      });
    }

    const JUDGE_URL = getJudgeUrl();
    let judgeResponse;
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
    } catch (err: any) {
      console.error("Judge request failed:", err);
      return NextResponse.json({ error: "Failed to reach judge", details: err.message }, { status: 500 });
    }

    const dbUser = await dbHelpers.findUserByComputingId(computingId);
    const problem = await dbHelpers.findProblem(pid);
    const score = judgeResponse.score || 0;

    await dbHelpers.updateUserPointsAndProblems(computingId, score, score > 0 ? 1 : 0);
    if (problem) {
      await dbHelpers.addNewActivity(computingId, "submission", `Submitted a solution for ${problem.title} and received ${score} points`);
    }

    if (dbUser) {
      const newPoints = (dbUser.pointsAcquired || 0) + score;
      let newRank = dbUser.rank;

      if (newPoints > 1000) newRank = "Expert";
      else if (newPoints > 500) newRank = "Advanced";
      else if (newPoints > 200) newRank = "Intermediate";
      else if (newPoints > 100) newRank = "Beginner";

      if (newRank !== dbUser.rank) {
        await dbHelpers.updateUserRank(computingId, newRank!);
        await dbHelpers.addNewActivity(computingId, "rank_up", `Achieved the rank of ${newRank}`);
      }
    }

    if (endsAt && endsAt < now) {
      return NextResponse.json({ message: "Contest has ended, submission recorded", sid: submission.id });
    } else {
      return NextResponse.json({ message: "Submission received", sid: submission.id });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
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
      submissions: subs,
      problem,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function handleGetAllSubmissions(request: NextRequest) {
  try {
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
