import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const WEIGHTS = {
  solved: 10,
  contests: 20,
  points: 1,
  login7d: 1,
  submission7d: 8,
} as const;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const globalForMetadata = globalThis as unknown as {
  loginEvents7dByComputingId: Map<string, number[]> | undefined;
  submissionEvents7dByComputingId: Map<string, number[]> | undefined;
};

interface StudentStats {
  computingId: string;
  problemsSolved: number;
  contestsParticipated: number;
  pointsAcquired: number;
  submissions7d: number;
  activeDays7d: number;
  logins7d: number;
}

type Trigger = "login" | "submission" | "unknown";

interface ContestMetricRow {
  contest_id: string;
  contest_name: string;
  solve_rate: number;
  mean_solve_time_minutes: number | null;
  median_solve_time_minutes: number | null;
  attempts_to_solve: number | null;
}

interface ProblemMetricRow {
  contest_id: string;
  contest_name: string;
  problem_id: string;
  problem_code: string;
  problem_title: string;
  time_to_first_submission_minutes: number | null;
  time_to_first_correct_submission_minutes: number | null;
  post_hint_solve_probability: number | null;
  attempts_before_hint: number | null;
  attempts_after_hint: number | null;
  time_to_solve_after_hint_minutes: number | null;
}

type SegmentKey = "all" | "groupA" | "groupB";

interface SegmentedMetricBundle {
  contest_metrics: ContestMetricRow[];
  problem_metrics: ProblemMetricRow[];
}

function loginStore(): Map<string, number[]> {
  if (!globalForMetadata.loginEvents7dByComputingId) {
    globalForMetadata.loginEvents7dByComputingId = new Map<string, number[]>();
  }
  return globalForMetadata.loginEvents7dByComputingId;
}

function submissionStore(): Map<string, number[]> {
  if (!globalForMetadata.submissionEvents7dByComputingId) {
    globalForMetadata.submissionEvents7dByComputingId = new Map<string, number[]>();
  }
  return globalForMetadata.submissionEvents7dByComputingId;
}

function trim7d(events: number[], nowMs: number): number[] {
  const threshold = nowMs - SEVEN_DAYS_MS;
  return events.filter((ts) => ts >= threshold);
}

function addLoginEvent(computingId: string): void {
  const store = loginStore();
  const nowMs = Date.now();
  const current = trim7d(store.get(computingId) ?? [], nowMs);
  current.push(nowMs);
  store.set(computingId, current);
}

function countLoginEvents7d(computingId: string): number {
  const store = loginStore();
  const nowMs = Date.now();
  const current = trim7d(store.get(computingId) ?? [], nowMs);
  store.set(computingId, current);
  return current.length;
}

function addSubmissionEvent(computingId: string): void {
  const store = submissionStore();
  const nowMs = Date.now();
  const current = trim7d(store.get(computingId) ?? [], nowMs);
  current.push(nowMs);
  store.set(computingId, current);
}

function submissionEventDates7d(computingId: string): Date[] {
  const store = submissionStore();
  const nowMs = Date.now();
  const current = trim7d(store.get(computingId) ?? [], nowMs);
  store.set(computingId, current);
  return current.map((ts) => new Date(ts));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseTrigger(body: unknown): Trigger {
  if (!body || typeof body !== "object") {
    return "unknown";
  }
  const maybe = (body as Record<string, unknown>).trigger;
  return maybe === "login" || maybe === "submission" ? maybe : "unknown";
}

function parseTargetComputingId(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const raw = (body as Record<string, unknown>).targetComputingId;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

async function collectStudentStats(): Promise<StudentStats[]> {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      computingId: true,
      submissions: {
        select: {
          contestId: true,
          problemId: true,
          status: true,
          score: true,
          createdAt: true,
        },
      },
    },
  });

  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - SEVEN_DAYS_MS;

  return students.map((student) => {
    const solvedProblems = new Set<string>();
    const contests = new Set<string>();
    const bestScoreByContestProblem = new Map<string, number>();
    const activeDays = new Set<string>();
    let submissions7d = 0;

    for (const submission of student.submissions) {
      contests.add(submission.contestId);

      if (submission.status === "ACCEPTED") {
        solvedProblems.add(submission.problemId);
      }

      const key = `${submission.contestId}:${submission.problemId}`;
      const prior = bestScoreByContestProblem.get(key) ?? 0;
      if (submission.score > prior) {
        bestScoreByContestProblem.set(key, submission.score);
      }

      if (submission.createdAt.getTime() >= sevenDaysAgoMs) {
        submissions7d += 1;
        activeDays.add(dayKey(submission.createdAt));
      }
    }

    const localSubmissionEvents = submissionEventDates7d(student.computingId);
    submissions7d += localSubmissionEvents.length;
    for (const eventDate of localSubmissionEvents) {
      activeDays.add(dayKey(eventDate));
    }

    const pointsAcquired = [...bestScoreByContestProblem.values()].reduce(
      (sum, score) => sum + score,
      0,
    );

    return {
      computingId: student.computingId,
      problemsSolved: solvedProblems.size,
      contestsParticipated: contests.size,
      pointsAcquired,
      submissions7d,
      activeDays7d: activeDays.size,
      logins7d: countLoginEvents7d(student.computingId),
    };
  });
}

function participationBase(stats: StudentStats): number {
  return (
    stats.problemsSolved * WEIGHTS.solved +
    stats.contestsParticipated * WEIGHTS.contests +
    stats.pointsAcquired * WEIGHTS.points
  );
}

function participationBonus(stats: StudentStats): number {
  return stats.logins7d * WEIGHTS.login7d + stats.submissions7d * WEIGHTS.submission7d;
}

function denseRank(values: number[], target: number): number | null {
  if (values.length === 0) {
    return null;
  }
  let rank = 0;
  let last: number | null = null;
  for (const score of values) {
    if (last === null || last !== score) {
      rank += 1;
      last = score;
    }
    if (score === target) {
      return rank;
    }
  }
  return null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function round2(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function inferSegment(computingId: string): "groupA" | "groupB" {
  const seed = [...computingId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return seed % 2 === 0 ? "groupA" : "groupB";
}

function computeContestAndProblemMetrics(args: {
  contests: Array<{
    id: string;
    name: string;
    startsAt: Date;
    contestProblems: Array<{
      problem: { id: string; code: string; title: string };
    }>;
    submissions: Array<{
      problemId: string;
      status: string;
      createdAt: Date;
      user: { role: string; computingId: string };
    }>;
  }>;
  includeComputingId: (computingId: string) => boolean;
}): SegmentedMetricBundle {
  const contestMetrics: ContestMetricRow[] = [];
  const problemMetrics: ProblemMetricRow[] = [];

  for (const contest of args.contests) {
    const studentSubs = contest.submissions.filter(
      (submission) =>
        submission.user.role === "STUDENT" && args.includeComputingId(submission.user.computingId),
    );
    const participants = new Set(studentSubs.map((submission) => submission.user.computingId));
    const solvedUsers = new Set(
      studentSubs
        .filter((submission) => submission.status === "ACCEPTED")
        .map((submission) => submission.user.computingId),
    );
    const solveRate =
      participants.size === 0 ? 0 : (solvedUsers.size / participants.size) * 100;

    const attemptsUntilSolve: number[] = [];
    const solveTimesMinutes: number[] = [];
    const byUserProblem = new Map<string, typeof studentSubs>();

    for (const submission of studentSubs) {
      const key = `${submission.user.computingId}:${submission.problemId}`;
      const existing = byUserProblem.get(key) ?? [];
      existing.push(submission);
      byUserProblem.set(key, existing);
    }

    for (const submissions of byUserProblem.values()) {
      submissions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const firstAcceptedIndex = submissions.findIndex((submission) => submission.status === "ACCEPTED");
      if (firstAcceptedIndex >= 0) {
        attemptsUntilSolve.push(firstAcceptedIndex + 1);
        const acceptedAt = submissions[firstAcceptedIndex].createdAt.getTime();
        const deltaMinutes = Math.max(0, (acceptedAt - contest.startsAt.getTime()) / 60000);
        solveTimesMinutes.push(deltaMinutes);
      }
    }

    contestMetrics.push({
      contest_id: contest.id,
      contest_name: contest.name,
      solve_rate: round2(solveRate) ?? 0,
      mean_solve_time_minutes: round2(average(solveTimesMinutes)),
      median_solve_time_minutes: round2(median(solveTimesMinutes)),
      attempts_to_solve: round2(average(attemptsUntilSolve)),
    });

    for (const link of contest.contestProblems) {
      const problem = link.problem;
      const problemSubs = studentSubs
        .filter((submission) => submission.problemId === problem.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const byUserSubs = new Map<string, typeof problemSubs>();
      for (const submission of problemSubs) {
        const group = byUserSubs.get(submission.user.computingId) ?? [];
        group.push(submission);
        byUserSubs.set(submission.user.computingId, group);
      }

      const firstSubmission = problemSubs[0];
      const firstCorrect = problemSubs.find((submission) => submission.status === "ACCEPTED");

      const firstSubmissionMinutes = firstSubmission
        ? Math.max(0, (firstSubmission.createdAt.getTime() - contest.startsAt.getTime()) / 60000)
        : null;
      const firstCorrectMinutes = firstCorrect
        ? Math.max(0, (firstCorrect.createdAt.getTime() - contest.startsAt.getTime()) / 60000)
        : null;

      const attemptsBeforeHintSamples: number[] = [];
      const attemptsAfterHintSamples: number[] = [];
      const solveAfterHintMinutes: number[] = [];
      let postHintCandidates = 0;
      let postHintSolved = 0;

      for (const userSubs of byUserSubs.values()) {
        userSubs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const attempts = userSubs.length;
        const firstAcceptedIndex = userSubs.findIndex((submission) => submission.status === "ACCEPTED");

        attemptsBeforeHintSamples.push(Math.min(attempts, 2));
        attemptsAfterHintSamples.push(Math.max(attempts - 2, 0));

        if (attempts > 2) {
          postHintCandidates += 1;
          if (firstAcceptedIndex >= 2) {
            postHintSolved += 1;
            const hintAnchor = userSubs[1]?.createdAt.getTime();
            const solvedAt = userSubs[firstAcceptedIndex]?.createdAt.getTime();
            if (hintAnchor && solvedAt && solvedAt >= hintAnchor) {
              solveAfterHintMinutes.push((solvedAt - hintAnchor) / 60000);
            }
          }
        }
      }

      problemMetrics.push({
        contest_id: contest.id,
        contest_name: contest.name,
        problem_id: problem.id,
        problem_code: problem.code,
        problem_title: problem.title,
        time_to_first_submission_minutes: round2(firstSubmissionMinutes),
        time_to_first_correct_submission_minutes: round2(firstCorrectMinutes),
        post_hint_solve_probability:
          postHintCandidates === 0 ? null : round2((postHintSolved / postHintCandidates) * 100),
        attempts_before_hint: round2(average(attemptsBeforeHintSamples)),
        attempts_after_hint: round2(average(attemptsAfterHintSamples)),
        time_to_solve_after_hint_minutes: round2(average(solveAfterHintMinutes)),
      });
    }
  }

  return {
    contest_metrics: contestMetrics,
    problem_metrics: problemMetrics,
  };
}

function badges(stats: StudentStats) {
  const all = [
    {
      id: "first-submission",
      name: "First Submission",
      description: "Submit at least one solution.",
      earned: stats.submissions7d >= 1,
    },
    {
      id: "active-learner",
      name: "Active Learner",
      description: "Log in at least 5 times in the last 7 days.",
      earned: stats.logins7d >= 5,
    },
    {
      id: "consistent-week",
      name: "Consistent Week",
      description: "Be active on 7 distinct days in the last 7 days.",
      earned: stats.activeDays7d >= 7,
    },
    {
      id: "problem-solver-10",
      name: "Problem Solver I",
      description: "Solve at least 10 problems.",
      earned: stats.problemsSolved >= 10,
    },
    {
      id: "problem-solver-50",
      name: "Problem Solver II",
      description: "Solve at least 50 problems.",
      earned: stats.problemsSolved >= 50,
    },
    {
      id: "contest-regular",
      name: "Contest Regular",
      description: "Participate in at least 5 contests.",
      earned: stats.contestsParticipated >= 5,
    },
    {
      id: "point-collector",
      name: "Point Collector",
      description: "Reach at least 1000 total points.",
      earned: stats.pointsAcquired >= 1000,
    },
  ];
  return { earned: all.filter((item) => item.earned), all };
}

function buildStudentPayload(
  target: StudentStats,
  allStudents: StudentStats[],
  role: "student",
) {
  const byPoints = allStudents.map((s) => s.pointsAcquired).sort((a, b) => b - a);
  const byParticipation = allStudents
    .map((s) => participationBase(s) + participationBonus(s))
    .sort((a, b) => b - a);

  const base = participationBase(target);
  const bonus = participationBonus(target);
  const total = base + bonus;

  const rankPoints = denseRank(byPoints, target.pointsAcquired);
  const rankParticipation = denseRank(byParticipation, total);

  return {
    role,
    cards: {
      totalSolved: target.problemsSolved,
      participationContests: target.contestsParticipated,
      totalScore: target.pointsAcquired,
      rankNumber: rankPoints,
      rankPointsNumber: rankPoints,
      rankParticipationNumber: rankParticipation,
    },
    participation: {
      base,
      bonus,
      total,
      activity_7d: {
        logins_7d: target.logins7d,
        submissions_7d: target.submissions7d,
      },
      active_days_7d: target.activeDays7d,
    },
    ranks: {
      by_points: rankPoints,
      by_participation: rankParticipation,
    },
    badges: badges(target),
  };
}

async function buildInstructorPayload(role: "instructor" | "admin") {
  const [usersCount, students, studentStats, contests] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        computingId: true,
        firstName: true,
        lastName: true,
      },
    }),
    collectStudentStats(),
    prisma.contest.findMany({
      select: {
        id: true,
        name: true,
        startsAt: true,
        contestProblems: {
          select: {
            problem: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
        submissions: {
          select: {
            problemId: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                role: true,
                computingId: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalStudents = studentStats.length;
  const avgSolved =
    totalStudents === 0
      ? 0
      : studentStats.reduce((sum, s) => sum + s.problemsSolved, 0) / totalStudents;
  const avgPoints =
    totalStudents === 0
      ? 0
      : studentStats.reduce((sum, s) => sum + s.pointsAcquired, 0) / totalStudents;

  const names = new Map(
    students.map((s) => [s.computingId, `${s.firstName} ${s.lastName}`]),
  );

  const topStudents = [...studentStats]
    .sort((a, b) => {
      const pa = participationBase(a) + participationBonus(a);
      const pb = participationBase(b) + participationBonus(b);
      if (pb !== pa) {
        return pb - pa;
      }
      return b.pointsAcquired - a.pointsAcquired;
    })
    .slice(0, 10)
    .map((s) => ({
      computing_id: s.computingId,
      nickname: names.get(s.computingId) ?? s.computingId,
      problems_solved: s.problemsSolved,
      points_acquired: s.pointsAcquired,
      competitions_participated: s.contestsParticipated,
      logins_7d: s.logins7d,
      submissions_7d: s.submissions7d,
      participation_score: participationBase(s) + participationBonus(s),
    }));

  const submissions7d = studentStats.reduce((sum, s) => sum + s.submissions7d, 0);
  const submitters7d = studentStats.filter((s) => s.submissions7d > 0).length;
  const activeStudents7d = studentStats.filter(
    (s) => s.submissions7d > 0 || s.logins7d > 0,
  ).length;

  const allStudentIds = new Set(students.map((student) => student.computingId));
  const groupAIds = new Set(
    students
      .filter((student) => inferSegment(student.computingId) === "groupA")
      .map((student) => student.computingId),
  );
  const groupBIds = new Set(
    students
      .filter((student) => inferSegment(student.computingId) === "groupB")
      .map((student) => student.computingId),
  );

  const segmentedMetrics: Record<SegmentKey, SegmentedMetricBundle> = {
    all: computeContestAndProblemMetrics({
      contests,
      includeComputingId: (computingId) => allStudentIds.has(computingId),
    }),
    groupA: computeContestAndProblemMetrics({
      contests,
      includeComputingId: (computingId) => groupAIds.has(computingId),
    }),
    groupB: computeContestAndProblemMetrics({
      contests,
      includeComputingId: (computingId) => groupBIds.has(computingId),
    }),
  };

  const studentViews = Object.fromEntries(
    students.map((student) => [
      student.computingId,
      computeContestAndProblemMetrics({
        contests,
        includeComputingId: (computingId) => computingId === student.computingId,
      }),
    ]),
  );

  return {
    role,
    overview: {
      total_users: usersCount,
      total_students: totalStudents,
      avg_solved: avgSolved,
      avg_points: avgPoints,
      active_students_7d: activeStudents7d,
    },
    submissions: {
      submissions_7d: submissions7d,
      submitters_7d: submitters7d,
      trend_7d: [],
    },
    topStudents,
    contest_metrics: segmentedMetrics.all.contest_metrics,
    problem_metrics: segmentedMetrics.all.problem_metrics,
    segmented_metrics: segmentedMetrics,
    student_views: studentViews,
    students_catalog: students.map((student) => ({
      computingId: student.computingId,
      name: `${student.firstName} ${student.lastName}`,
      segment: inferSegment(student.computingId),
    })),
    analytics_notes: [
      "Hint metrics currently use a heuristic: hint is considered after the 2nd attempt.",
      "Solve-time metrics use contest start time as baseline.",
    ],
  };
}

export async function handleMetadataGet(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role === "student") {
      const allStudents = await collectStudentStats();
      const target = allStudents.find((item) => item.computingId === user.computingId);
      if (!target) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(buildStudentPayload(target, allStudents, "student"), { status: 200 });
    }

    if (user.role === "instructor" || user.role === "admin") {
      return NextResponse.json(await buildInstructorPayload(user.role), { status: 200 });
    }

    return NextResponse.json({ role: user.role, message: "No metadata view for this role yet." });
  } catch (error) {
    console.error("[metadata GET] error:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(isDev
          ? { details: error instanceof Error ? error.message : "Unknown error" }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function handleMetadataPost(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as unknown;
    const trigger = parseTrigger(body);
    const targetComputingId = parseTargetComputingId(body);

    if (user.role !== "student") {
      const isDevMode = process.env.AUTH_MODE === "dev";
      if (isDevMode && targetComputingId && (trigger === "login" || trigger === "submission")) {
        if (trigger === "login") {
          addLoginEvent(targetComputingId);
        } else {
          addSubmissionEvent(targetComputingId);
        }

        const instructorPayload = await buildInstructorPayload(
          user.role === "admin" ? "admin" : "instructor",
        );
        return NextResponse.json(
          {
            ok: true,
            trigger,
            role: user.role,
            targetComputingId,
            message: "Simulated student event in dev mode.",
            updated: instructorPayload,
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          trigger,
          computing_id: user.computingId,
          role: user.role,
          message: "Metadata trigger updates are student-focused.",
        },
        { status: 200 },
      );
    }

    if (trigger === "login") {
      addLoginEvent(user.computingId);
    }
    if (trigger === "submission") {
      addSubmissionEvent(user.computingId);
    }

    const allStudents = await collectStudentStats();
    const target = allStudents.find((item) => item.computingId === user.computingId);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = buildStudentPayload(target, allStudents, "student");

    return NextResponse.json(
      {
        ok: true,
        trigger,
        computing_id: user.computingId,
        role: user.role,
        cards: payload.cards,
        metrics: {
          problems_solved: payload.cards.totalSolved,
          competitions_participated: payload.cards.participationContests,
          points_acquired: payload.cards.totalScore,
        },
        participation: payload.participation,
        ranks: payload.ranks,
        badges: payload.badges,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[metadata POST] error:", error);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(isDev
          ? { details: error instanceof Error ? error.message : "Unknown error" }
          : {}),
      },
      { status: 500 },
    );
  }
}
