import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";

export async function handleRequestHint(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request_data = await request.json();
    const pid = request_data.pid;
    delete request_data.pid;
    request_data.username = user.computingId;

    const prior_problems = await dbHelpers.getReleventSolvedProblems(user.computingId, pid);
    const userData = await dbHelpers.findUserByComputingId(user.computingId);
    const topics = await dbHelpers.getProblemTopic(pid);

    request_data.context = prior_problems || "";
    request_data.user_rank = userData?.rank || "Beginner";
    request_data.topic = topics;

    const JUDGE_URL = process.env.JUDGE_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${JUDGE_URL}/request_hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request_data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate hint", details: error.message },
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
    const computing_id = searchParams.get("computing_id") || user.computingId;
    const pid = searchParams.get("pid");

    if (!pid) {
      return NextResponse.json({ error: "Missing pid" }, { status: 400 });
    }

    const hints = await dbHelpers.getAllHints(computing_id, pid);

    return NextResponse.json({ hints });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not retrieve hints", details: error.message },
      { status: 500 }
    );
  }
}
