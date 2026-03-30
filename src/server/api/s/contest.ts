import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";

export async function handleRegisterContest(
  request: NextRequest,
  cid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;

    await dbHelpers.insertParticipate(computingId, cid, "contestant");
    const registeredContests = await dbHelpers.findContestsForUser(computingId, "contestant");

    return NextResponse.json({ message: "Registered successfully", registeredContests });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function handleUnregisterContest(
  request: NextRequest,
  cid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;

    await dbHelpers.removeParticipate(computingId, cid, "contestant");
    const registeredContests = await dbHelpers.findContestsForUser(computingId, "contestant");

    return NextResponse.json({ message: "Unregistered successfully", registeredContests });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function handleEnterContest(
  request: NextRequest,
  cid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;

    const contest = await dbHelpers.findSpecificContestForUser(computingId, cid, "contestant");

    if (contest) {
      const now = new Date();
      if (contest.startsAt > now) {
        return NextResponse.json({ error: "Contest has not started yet" }, { status: 400 });
      }

      const contestProblems = await dbHelpers.getProblemsForContest(cid);
      for (const cp of contestProblems) {
        await dbHelpers.createProblemStatus(computingId, cid, cp.problemId);
      }
      await dbHelpers.incrementCompetitionsParticipated(computingId);
      return NextResponse.json({ message: "Entered contest", cid });
    } else {
      return NextResponse.json({ error: "Not registered for contest" }, { status: 403 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function handleGetContestDetails(
  request: NextRequest,
  cid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;
    const role = user.role;

    const contest = await dbHelpers.findContest(cid);

    if (!contest || !contest.published || contest.status === "DRAFT") {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const contestProblemsStatus = await dbHelpers.findContestsProblemsStatusForUser(
      computingId,
      cid
    );

    return NextResponse.json({ computingId, contestProblemsStatus, role });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function handleGetClosedContestInfo(
  request: NextRequest,
  cid: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contest = await dbHelpers.findContest(cid);
    return NextResponse.json({ contest });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
