import type { ExperimentGroup } from "@prisma/client";
import type { SnapshotType } from "@/lib/trpc/types/instructorAnalysis";

interface ContestMetricInput {
  id: string;
  startsAt: Date;
  contestProblems: Array<{
    problem: {
      id: string;
    };
  }>;
  experimentGroups: Array<{
    groupName: ExperimentGroup;
  }>;
  participations: Array<{
    userId: string;
    role: string;
    experimentGroup: ExperimentGroup | null;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  contestProblemSessions: Array<{
    userId: string;
    problemId: string;
    startedAt: Date;
    firstSubmitAt: Date | null;
    hintTriggeredAt: Date | null;
    solvedAt: Date | null;
    solved: boolean;
  }>;
  submissions: Array<{
    userId: string;
    problemId: string;
    createdAt: Date;
  }>;
}

export interface ComputedContestGroupMetricsRow {
  contestId: string;
  groupName: ExperimentGroup;
  snapshotType: SnapshotType;
  watermark: Date;
  solveRate: number;
  meanSolveTimeSec: number | null;
  medianSolveTimeSec: number | null;
  attemptsToSolveMean: number | null;
}

export interface ComputedProblemStudentMetricsRow {
  contestId: string;
  problemId: string;
  studentId: string;
  snapshotType: SnapshotType;
  watermark: Date;
  groupName: ExperimentGroup | null;
  timeToFirstSubmissionSec: number | null;
  timeToFirstCorrectSec: number | null;
  postHintSolveProbability: number | null;
  attemptsBeforeHint: number | null;
  attemptsAfterHint: number | null;
  timeToSolveAfterHintSec: number | null;
}

function toSeconds(start: Date, end: Date | null): number | null {
  if (!end) {
    return null;
  }

  const diff = Math.round((end.getTime() - start.getTime()) / 1000);
  return diff >= 0 ? diff : null;
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

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function buildSubmissionMap(contest: ContestMetricInput, watermark: Date): Map<string, Date[]> {
  const map = new Map<string, Date[]>();

  contest.submissions.forEach((submission) => {
    if (submission.createdAt.getTime() > watermark.getTime()) {
      return;
    }

    const key = `${submission.userId}:${submission.problemId}`;
    const current = map.get(key) ?? [];
    current.push(submission.createdAt);
    map.set(key, current);
  });

  map.forEach((entries, key) => {
    map.set(
      key,
      entries.sort((left, right) => left.getTime() - right.getTime()),
    );
  });

  return map;
}

export function computeInstructorMetricsSnapshot(
  contest: ContestMetricInput,
  snapshotType: SnapshotType,
  watermark: Date,
): {
  contestGroupRows: ComputedContestGroupMetricsRow[];
  problemStudentRows: ComputedProblemStudentMetricsRow[];
} {
  const contestantParticipations = contest.participations.filter(
    (participation) => participation.role === "contestant",
  );
  const problemIds = contest.contestProblems.map((entry) => entry.problem.id);
  const submissionMap = buildSubmissionMap(contest, watermark);
  const sessionsByUserProblem = new Map(
    contest.contestProblemSessions
      .filter((session) => session.startedAt.getTime() <= watermark.getTime())
      .map((session) => [`${session.userId}:${session.problemId}`, session] as const),
  );
  const groups = Array.from(
    new Set<ExperimentGroup>([
      ...contest.experimentGroups.map((group) => group.groupName),
      ...contestantParticipations
        .map((participation) => participation.experimentGroup)
        .filter((group): group is ExperimentGroup => group !== null),
    ]),
  ).sort();

  const contestGroupRows = groups.map((groupName) => {
    const groupParticipants = contestantParticipations.filter(
      (participation) => participation.experimentGroup === groupName,
    );
    const totalExpected = groupParticipants.length * problemIds.length;
    let solvedCount = 0;
    const solveDurations: number[] = [];
    const attemptsToSolve: number[] = [];

    groupParticipants.forEach((participation) => {
      problemIds.forEach((problemId) => {
        const session = sessionsByUserProblem.get(`${participation.userId}:${problemId}`);
        const solvedAt =
          session?.solved && session.solvedAt && session.solvedAt.getTime() <= watermark.getTime()
            ? session.solvedAt
            : null;

        if (!session || !solvedAt) {
          return;
        }

        solvedCount += 1;
        const solveSeconds = toSeconds(session.startedAt, solvedAt);
        if (solveSeconds !== null) {
          solveDurations.push(solveSeconds);
        }

        const submissions = submissionMap.get(`${participation.userId}:${problemId}`) ?? [];
        attemptsToSolve.push(
          submissions.filter((submittedAt) => submittedAt.getTime() <= solvedAt.getTime()).length,
        );
      });
    });

    const meanSolveTimeSec = average(solveDurations);
    const attemptsToSolveMean = average(attemptsToSolve);

    return {
      contestId: contest.id,
      groupName,
      snapshotType,
      watermark,
      solveRate: totalExpected === 0 ? 0 : Math.round((solvedCount / totalExpected) * 1000) / 10,
      meanSolveTimeSec: meanSolveTimeSec === null ? null : Math.round(meanSolveTimeSec),
      medianSolveTimeSec: median(solveDurations),
      attemptsToSolveMean:
        attemptsToSolveMean === null ? null : Math.round(attemptsToSolveMean * 10) / 10,
    };
  });

  const problemStudentRows = contest.contestProblems.flatMap((entry) =>
    contestantParticipations
      .slice()
      .sort((left, right) => {
        const leftName = `${left.user.firstName} ${left.user.lastName}`;
        const rightName = `${right.user.firstName} ${right.user.lastName}`;
        return leftName.localeCompare(rightName);
      })
      .map((participation) => {
        const session = sessionsByUserProblem.get(`${participation.userId}:${entry.problem.id}`);
        const submissions = submissionMap.get(`${participation.userId}:${entry.problem.id}`) ?? [];
        const solvedAt =
          session?.solved && session.solvedAt && session.solvedAt.getTime() <= watermark.getTime()
            ? session.solvedAt
            : null;
        const hintTriggeredAt =
          session?.hintTriggeredAt && session.hintTriggeredAt.getTime() <= watermark.getTime()
            ? session.hintTriggeredAt
            : null;
        const anchorStart = session?.startedAt ?? contest.startsAt;
        const firstSubmissionAt =
          session?.firstSubmitAt && session.firstSubmitAt.getTime() <= watermark.getTime()
            ? session.firstSubmitAt
            : submissions[0] ?? null;

        return {
          contestId: contest.id,
          problemId: entry.problem.id,
          studentId: participation.userId,
          snapshotType,
          watermark,
          groupName: participation.experimentGroup,
          timeToFirstSubmissionSec: toSeconds(anchorStart, firstSubmissionAt),
          timeToFirstCorrectSec: toSeconds(anchorStart, solvedAt),
          postHintSolveProbability: hintTriggeredAt ? (solvedAt ? 100 : 0) : null,
          attemptsBeforeHint: hintTriggeredAt
            ? submissions.filter((submittedAt) => submittedAt.getTime() <= hintTriggeredAt.getTime()).length
            : null,
          attemptsAfterHint: hintTriggeredAt
            ? submissions.filter((submittedAt) => submittedAt.getTime() > hintTriggeredAt.getTime()).length
            : null,
          timeToSolveAfterHintSec:
            hintTriggeredAt && solvedAt ? toSeconds(hintTriggeredAt, solvedAt) : null,
        };
      }),
  );

  return {
    contestGroupRows,
    problemStudentRows,
  };
}
