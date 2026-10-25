import { NextRequest, NextResponse } from "next/server";
import { can, normalizeRole } from "@/lib/authz";
import { getEffectiveContestStatus, hasContestStarted } from "@/lib/contestStatus";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import { prisma } from "@/lib/prisma";
import { AI_HINT_COOLDOWN_SECONDS, AI_HINT_DAILY_LIMIT } from "@/lib/aiHintLimits";
import { redactStudentCode, type StudentIdentity } from "@/server/aiHintPrivacy";
import { getAiHintsEnabled } from "@/server/siteSettings";

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

async function findContestForHintAccess(computingId: string, role: string, contestId: string) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole && can(normalizedRole).canManageContest) {
    return dbHelpers.findContestForViewer(contestId, computingId, role);
  }

  return dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant");
}

async function assertContestAllowsAiHint(computingId: string, role: string, contestId: string) {
  const contest = await findContestForHintAccess(computingId, role, contestId);

  if (!contest) {
    return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  }

  if (!contest.aiHintEnabled) {
    return NextResponse.json(
      { error: "AI hints are disabled for this contest" },
      { status: 403 },
    );
  }

  const normalizedRole = normalizeRole(role);
  if (!(normalizedRole && can(normalizedRole).canManageContest) && !hasContestStarted(contest)) {
    return NextResponse.json({ error: "Contest has not started yet" }, { status: 403 });
  }

  const now = new Date();
  const contestEnded =
    getEffectiveContestStatus(contest) === "ENDED" ||
    Boolean(contest.endsAt && contest.endsAt <= now);

  if (contestEnded) {
    return NextResponse.json(
      { error: "AI hints are disabled after the contest ends" },
      { status: 403 },
    );
  }

  return null;
}

// Only these fields leave Coder, none of which identifies the student: the hint service
// passes everything on to a third-party model.
function buildHintPayload(args: {
  requestData: HintRequestBody;
  student: StudentIdentity;
  problemId: string;
  problemCode: string;
  problemTitle: string;
  problemDescription: string;
  relatedSolvedTitles: string[];
  userRank: string;
  topics: unknown;
}) {
  const language = toStringValue(args.requestData.language);
  const code = redactStudentCode(toStringValue(args.requestData.code), language, args.student);

  return {
    pid: args.problemId,
    problem_id: args.problemId,
    problem: args.problemTitle,
    description: args.problemDescription,
    // The hint service's prompt still addresses the user by name, so give it a neutral one
    username: "the student",
    code,
    submission: code,
    textcode: code,
    language,
    // Fresh for every request, so it cannot link one student's hints together
    connection_id: crypto.randomUUID(),
    problem_code: args.problemCode,
    problem_title: args.problemTitle,
    title: args.problemTitle,
    context: args.relatedSolvedTitles.join(", "),
    user_rank: args.userRank,
    topic: args.topics,
    topics: args.topics,
  };
}

// Reserves the student's next hint, or explains why they must wait. The row is the
// rate-limit record and, once the hint arrives, the log of what the student was shown.
async function reserveHint(userId: string, problemId: string) {
  const now = Date.now();
  const cooldownStart = new Date(now - AI_HINT_COOLDOWN_SECONDS * 1000);
  const dayStart = new Date(now - 24 * 60 * 60 * 1000);

  const latest = await prisma.hint.findFirst({
    where: { userId, createdAt: { gt: cooldownStart } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest) {
    const wait = Math.ceil((latest.createdAt.getTime() + AI_HINT_COOLDOWN_SECONDS * 1000 - now) / 1000);
    return { error: `You can ask for another hint in ${Math.max(wait, 1)} seconds.` };
  }

  const lastDay = await prisma.hint.findMany({
    where: { userId, createdAt: { gt: dayStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (lastDay.length >= AI_HINT_DAILY_LIMIT) {
    const freesAt = new Date(lastDay[0].createdAt.getTime() + 24 * 60 * 60 * 1000);
    const minutes = Math.ceil((freesAt.getTime() - now) / 60000);
    return {
      error: `You have used all ${AI_HINT_DAILY_LIMIT} hints for the last 24 hours. Your next hint is available in ${minutes} minutes.`,
    };
  }

  const hintNum = (await prisma.hint.count({ where: { userId, problemId } })) + 1;
  const hint = await prisma.hint.create({ data: { userId, problemId, hintNum }, select: { id: true } });

  // Two requests at the same moment can both pass the checks above; keep only the earliest
  const sameWindow = await prisma.hint.findMany({
    where: { userId, createdAt: { gt: cooldownStart } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (sameWindow[0]?.id !== hint.id) {
    await prisma.hint.delete({ where: { id: hint.id } });
    return { error: `You can ask for another hint in ${AI_HINT_COOLDOWN_SECONDS} seconds.` };
  }

  return { hintId: hint.id };
}

export async function handleRequestHint(request: NextRequest) {
  let reservedHintId: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Site-wide switch (Admin -> System Settings), above the per-contest one: practice hints have no other gate
    if (!(await getAiHintsEnabled())) {
      return NextResponse.json({ error: "AI hints are turned off" }, { status: 403 });
    }

    const requestData = (await request.json()) as HintRequestBody;
    const pid = toStringValue(requestData.pid);
    const contestId = toStringValue(requestData.contest_id);

    if (!pid) {
      return NextResponse.json({ error: "Missing pid" }, { status: 400 });
    }

    if (contestId) {
      const contestAccessError = await assertContestAllowsAiHint(
        user.computingId,
        user.role,
        contestId,
      );

      if (contestAccessError) {
        return contestAccessError;
      }
    }

    const priorSubmissions = await dbHelpers.getReleventSolvedProblems(user.computingId, pid);
    const userData = await dbHelpers.findUserByComputingId(user.computingId);
    const problem = await dbHelpers.findProblem(pid);
    const topics = await dbHelpers.getProblemTopic(pid);

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // A contest problem gets hints only through its own contest, so the checks above apply.
    const inRequestedContest = contestId
      ? Boolean(
          await prisma.contestProblem.findFirst({
            where: { contestId, problemId: pid },
            select: { problemId: true },
          }),
        )
      : problem.source !== "CONTEST";
    if (!inRequestedContest) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reservation = await reserveHint(userData.id, pid);
    if ("error" in reservation) {
      return NextResponse.json({ error: reservation.error }, { status: 429 });
    }
    reservedHintId = reservation.hintId;

    const hintPayload = buildHintPayload({
      requestData,
      student: userData,
      problemId: pid,
      problemCode: problem.code,
      problemTitle: problem.title,
      problemDescription: problem.statement,
      relatedSolvedTitles: [...new Set((priorSubmissions ?? []).map((s) => s.problem.title))],
      userRank: userData.rank || "Beginner",
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

    const data = (await response.json()) as { code?: unknown; feedback?: unknown; validation?: unknown };
    await prisma.hint.update({
      where: { id: reservedHintId },
      data: {
        code: toStringValue(data.code) || null,
        feedback: toStringValue(data.feedback) || null,
        validation: toStringValue(data.validation) || null,
      },
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(error);
    // A failed hint does not count against the student's limits
    if (reservedHintId) {
      await prisma.hint.delete({ where: { id: reservedHintId } }).catch(() => undefined);
    }
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
