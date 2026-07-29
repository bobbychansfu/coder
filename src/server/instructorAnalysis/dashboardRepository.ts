import type { ExperimentGroup } from "@prisma/client";
import type { prisma } from "@/lib/prisma";
import type {
  ContestMetricRow,
  InstructorAnalyticsUiPayload,
  MetricBundle,
  ProblemMetricRow,
  SegmentKey,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import {
  DEFAULT_AI_HINT_NOTE,
  DEFAULT_GAMIFICATION_NOTE,
} from "@/fe/instructor/data/analysisConstants";

type PrismaClient = typeof prisma;
type Segment = Exclude<SegmentKey, "all">;

const EMPTY_BUNDLE = (): MetricBundle => ({ contest_metrics: [], problem_metrics: [] });

function segmentFor(group: ExperimentGroup | null): Segment | null {
  if (group === "A") return "groupA";
  if (group === "B") return "groupB";
  if (group === "C") return "groupC";
  return null;
}

function average(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value: number | null, digits = 1): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function minutesBetween(start: Date, end: Date | null): number | null {
  if (!end) return null;
  return Math.max(0, (end.getTime() - start.getTime()) / 60_000);
}

export async function loadInstructorAnalyticsDashboard(
  client: PrismaClient,
  computingId: string,
): Promise<InstructorAnalyticsUiPayload | null> {
  const instructor = await client.user.findUnique({
    where: { computingId },
    select: { id: true },
  });
  if (!instructor) return null;

  const contests = await client.contest.findMany({
    where: { instructorId: instructor.id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      name: true,
      startsAt: true,
      aiHintEnabled: true,
      experimentGroups: {
        select: { groupName: true, aiHintEnabled: true, hintDelayMinutes: true },
      },
      contestProblems: {
        orderBy: { ordering: "asc" },
        select: { problem: { select: { id: true, code: true, title: true } } },
      },
      participations: {
        where: { role: "contestant" },
        select: {
          userId: true,
          experimentGroup: true,
          user: {
            select: { computingId: true, firstName: true, lastName: true },
          },
        },
      },
      contestProblemSessions: {
        select: {
          userId: true,
          problemId: true,
          startedAt: true,
          firstSubmitAt: true,
          hintTriggeredAt: true,
          solvedAt: true,
          solved: true,
        },
      },
      submissions: {
        orderBy: { createdAt: "asc" },
        select: { userId: true, problemId: true, createdAt: true },
      },
    },
  });

  const segmented_metrics: InstructorAnalyticsUiPayload["segmented_metrics"] = {
    all: EMPTY_BUNDLE(),
    groupA: EMPTY_BUNDLE(),
    groupB: EMPTY_BUNDLE(),
    groupC: EMPTY_BUNDLE(),
  };
  const student_views: InstructorAnalyticsUiPayload["student_views"] = {};
  const studentCatalog = new Map<
    string,
    InstructorAnalyticsUiPayload["students_catalog"][number]
  >();

  function buildBundle(
    contest: (typeof contests)[number],
    userIds: Set<string>,
  ): MetricBundle {
    const sessions = contest.contestProblemSessions.filter((row) => userIds.has(row.userId));
    const submissions = contest.submissions.filter((row) => userIds.has(row.userId));
    const expected = userIds.size * contest.contestProblems.length;
    const solvedSessions = sessions.filter((row) => row.solved && row.solvedAt);
    const solveTimes = solvedSessions
      .map((row) => minutesBetween(row.startedAt, row.solvedAt))
      .filter((value): value is number => value !== null);
    const attemptsToSolve = solvedSessions.map((session) =>
      submissions.filter(
        (submission) =>
          submission.userId === session.userId &&
          submission.problemId === session.problemId &&
          submission.createdAt.getTime() <= session.solvedAt!.getTime(),
      ).length,
    );
    const contestMetric: ContestMetricRow = {
      contest_id: contest.id,
      contest_name: contest.name,
      solve_rate: expected === 0 ? 0 : rounded((solvedSessions.length / expected) * 100) ?? 0,
      mean_solve_time_minutes: rounded(average(solveTimes)),
      median_solve_time_minutes: rounded(median(solveTimes)),
      attempts_to_solve: rounded(average(attemptsToSolve)),
    };

    const problemMetrics: ProblemMetricRow[] = contest.contestProblems.map(({ problem }) => {
      const problemSessions = sessions.filter((row) => row.problemId === problem.id);
      const firstSubmissionTimes = problemSessions
        .map((row) => minutesBetween(row.startedAt, row.firstSubmitAt))
        .filter((value): value is number => value !== null);
      const firstCorrectTimes = problemSessions
        .filter((row) => row.solved)
        .map((row) => minutesBetween(row.startedAt, row.solvedAt))
        .filter((value): value is number => value !== null);
      const hinted = problemSessions.filter((row) => row.hintTriggeredAt);
      const attemptsBefore = hinted.map(
        (session) =>
          submissions.filter(
            (submission) =>
              submission.userId === session.userId &&
              submission.problemId === problem.id &&
              submission.createdAt.getTime() <= session.hintTriggeredAt!.getTime(),
          ).length,
      );
      const attemptsAfter = hinted.map(
        (session) =>
          submissions.filter(
            (submission) =>
              submission.userId === session.userId &&
              submission.problemId === problem.id &&
              submission.createdAt.getTime() > session.hintTriggeredAt!.getTime(),
          ).length,
      );
      const postHintTimes = hinted
        .map((row) => minutesBetween(row.hintTriggeredAt!, row.solvedAt))
        .filter((value): value is number => value !== null);

      return {
        contest_id: contest.id,
        contest_name: contest.name,
        problem_id: problem.id,
        problem_code: problem.code,
        problem_title: problem.title,
        time_to_first_submission_minutes: rounded(average(firstSubmissionTimes)),
        time_to_first_correct_submission_minutes: rounded(average(firstCorrectTimes)),
        post_hint_solve_probability:
          hinted.length === 0
            ? null
            : rounded((hinted.filter((row) => row.solved).length / hinted.length) * 100),
        attempts_before_hint: rounded(average(attemptsBefore)),
        attempts_after_hint: rounded(average(attemptsAfter)),
        time_to_solve_after_hint_minutes: rounded(average(postHintTimes)),
      };
    });

    return { contest_metrics: [contestMetric], problem_metrics: problemMetrics };
  }

  for (const contest of contests) {
    const allUserIds = new Set(contest.participations.map((row) => row.userId));
    const allBundle = buildBundle(contest, allUserIds);
    segmented_metrics.all.contest_metrics.push(...allBundle.contest_metrics);
    segmented_metrics.all.problem_metrics.push(...allBundle.problem_metrics);

    for (const participation of contest.participations) {
      const segment = segmentFor(participation.experimentGroup);
      if (segment) {
        studentCatalog.set(participation.user.computingId, {
          computingId: participation.user.computingId,
          name: `${participation.user.firstName} ${participation.user.lastName}`.trim(),
          segment,
        });
      }
    }

    for (const segment of ["groupA", "groupB", "groupC"] as const) {
      const groupUserIds = new Set(
        contest.participations
          .filter((row) => segmentFor(row.experimentGroup) === segment)
          .map((row) => row.userId),
      );
      const bundle = buildBundle(contest, groupUserIds);
      segmented_metrics[segment].contest_metrics.push(...bundle.contest_metrics);
      segmented_metrics[segment].problem_metrics.push(...bundle.problem_metrics);
    }

    for (const participation of contest.participations) {
      const bundle = buildBundle(contest, new Set([participation.userId]));
      const current = student_views[participation.user.computingId] ?? EMPTY_BUNDLE();
      current.contest_metrics.push(...bundle.contest_metrics);
      current.problem_metrics.push(...bundle.problem_metrics);
      student_views[participation.user.computingId] = current;
    }
  }

  return {
    segmented_metrics,
    student_views,
    students_catalog: [...studentCatalog.values()].sort((a, b) => a.name.localeCompare(b.name)),
    contests_catalog: contests.map((contest) => {
      const groupSettings = contest.experimentGroups
        .map((group) => {
          if (!group.aiHintEnabled) return `Group ${group.groupName}: no AI hints`;
          if (group.hintDelayMinutes === null) return `Group ${group.groupName}: AI hints enabled`;
          return `Group ${group.groupName}: hints after ${group.hintDelayMinutes} minutes`;
        })
        .join(". ");
      return {
        id: contest.id,
        name: contest.name,
        startsAt: contest.startsAt.toISOString(),
        hintNote: groupSettings || (contest.aiHintEnabled ? "AI hints enabled." : DEFAULT_AI_HINT_NOTE),
        gamificationNote: DEFAULT_GAMIFICATION_NOTE,
        comparisonNote: "",
      };
    }),
    analytics_notes: [],
  };
}
