import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";

type HintRequestBody = Record<string, unknown> & {
  pid?: unknown;
  code?: unknown;
  language?: unknown;
  connection_id?: unknown;
  contest_id?: unknown;
  problem_code?: unknown;
  problem_title?: unknown;
};

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function getAiHintServiceUrl() {
  return trimTrailingSlash(
    process.env.AI_HINT_URL || process.env.JUDGE_URL || "http://127.0.0.1:8000",
  );
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildHintPayload(args: {
  requestData: HintRequestBody;
  problemId: string;
  problemCode: string;
  problemTitle: string;
  problemDescription: string;
  username: string;
  context: unknown;
  userRank: string;
  topics: unknown;
}) {
  const code = toStringValue(args.requestData.code);
  const language = toStringValue(args.requestData.language);
  const connectionId =
    toStringValue(args.requestData.connection_id) || crypto.randomUUID();

  return {
    ...args.requestData,
    pid: args.problemId,
    problem_id: args.problemId,
    problem: args.problemTitle,
    description: args.problemDescription,
    username: args.username,
    computing_id: args.username,
    code,
    submission: code,
    textcode: code,
    language,
    connection_id: connectionId,
    contest_id: args.requestData.contest_id,
    problem_code: args.problemCode,
    problem_title: args.problemTitle,
    title: args.problemTitle,
    context: args.context || "",
    user_rank: args.userRank,
    topic: args.topics,
    topics: args.topics,
  };
}

export async function handleRequestHint(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = (await request.json()) as HintRequestBody;
    const pid = toStringValue(requestData.pid);

    if (!pid) {
      return NextResponse.json({ error: "Missing pid" }, { status: 400 });
    }

    const prior_problems = await dbHelpers.getReleventSolvedProblems(user.computingId, pid);
    const userData = await dbHelpers.findUserByComputingId(user.computingId);
    const problem = await dbHelpers.findProblem(pid);
    const topics = await dbHelpers.getProblemTopic(pid);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const hintPayload = buildHintPayload({
      requestData,
      problemId: pid,
      problemCode: problem.code,
      problemTitle: problem.title,
      problemDescription: problem.statement,
      username: user.computingId,
      context: prior_problems,
      userRank: userData?.rank || "Beginner",
      topics,
    });

    const aiHintServiceUrl = getAiHintServiceUrl();
    console.info("[ai-hint] forwarding request", {
      endpoint: `${aiHintServiceUrl}/request_hint`,
      pid,
      username: user.computingId,
      language: hintPayload.language,
    });

    const response = await fetch(`${aiHintServiceUrl}/request_hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hintPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to generate hint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function handleGetHints(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pid = searchParams.get("pid");

    if (!pid) {
      return NextResponse.json({ error: "Missing pid" }, { status: 400 });
    }

    const hints = await dbHelpers.getAllHints(user.computingId, pid);

    return NextResponse.json({ hints });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Could not retrieve hints",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
