import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";

function isContestViewableByRegisteredUser(contest: { published: boolean; status: string }) {
  return contest.published && contest.status !== "DRAFT";
}

async function findContestForViewer(computingId: string, role: string, contestId: string) {
  if (can(role as "student" | "instructor" | "admin").canManageContest) {
    return dbHelpers.findContest(contestId);
  }

  return dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant");
}

export async function handleRegisterContest(
  request: NextRequest,
  cid: string
) {
  void request;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;
    const existingContest = await dbHelpers.findSpecificContestForUser(computingId, cid, "contestant");

    if (!existingContest) {
      const joinableContest = await dbHelpers.findJoinableContestForUser(
        computingId,
        cid,
        "contestant",
      );

      if (!joinableContest) {
        return NextResponse.json({ error: "Contest is not open for registration" }, { status: 403 });
      }
    }

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
  void request;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;
    const role = user.role;
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

    const contestProblemsStatus = await dbHelpers.findContestsProblemsStatusForUser(
      computingId,
      cid
    );
    const scoreboard = await dbHelpers.findScoreboardRowsForContest(cid, computingId);

    return NextResponse.json({ computingId, contestProblemsStatus, scoreboard, role });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function handleGetClosedContestInfo(
  request: NextRequest,
  cid: string
) {
  void request;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contest = await findContestForViewer(user.computingId, user.role, cid);

    if (!contest) {
      return NextResponse.json(
        { error: can(user.role).canManageContest ? "Contest not found" : "Not registered for contest" },
        { status: can(user.role).canManageContest ? 404 : 403 },
      );
    }

    return NextResponse.json({ contest });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
