import type { ExperimentGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  SnapshotPreference,
  SnapshotRunStatus,
  SnapshotType,
} from "@/lib/trpc/types/instructorAnalysis";
import { computeInstructorMetricsSnapshot } from "./metrics";

type PrismaClient = typeof prisma;

export interface InstructorAnalysisSnapshot {
  instructor: {
    id: string;
    computingId: string;
  };
  contests: Array<{
    id: string;
    name: string;
    status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";
    startsAt: Date;
    endsAt: Date | null;
    contestProblems: Array<{
      problem: {
        id: string;
        code: string;
        title: string;
      };
    }>;
  }>;
  selectedContestId: string | null;
  selectedProblemId: string | null;
  snapshot: {
    requestedPreference: SnapshotPreference;
    resolvedType: SnapshotType | null;
    status: SnapshotRunStatus;
    watermark: Date | null;
    computedAt: Date | null;
    message: string;
  };
  contestGroupRows: Array<{
    groupName: ExperimentGroup;
    solveRate: number;
    meanSolveTimeSec: number | null;
    medianSolveTimeSec: number | null;
    attemptsToSolveMean: number | null;
  }>;
  problemStudentRows: Array<{
    studentId: string;
    studentName: string;
    groupName: ExperimentGroup | null;
    timeToFirstSubmissionSec: number | null;
    timeToFirstCorrectSec: number | null;
    postHintSolveProbability: number | null;
    attemptsBeforeHint: number | null;
    attemptsAfterHint: number | null;
    timeToSolveAfterHintSec: number | null;
  }>;
}

function resolveRequestedSnapshot(
  endsAt: Date | null,
  requestedPreference: SnapshotPreference,
): {
  resolvedType: SnapshotType | null;
  watermark: Date | null;
  message: string;
} {
  if (!endsAt) {
    return {
      resolvedType: null,
      watermark: null,
      message: "Snapshot scheduling starts once the contest has an end time.",
    };
  }

  const preliminary = new Date(endsAt.getTime() + 5 * 60 * 1000);
  const final = new Date(endsAt.getTime() + 15 * 60 * 1000);
  const now = new Date();

  if (requestedPreference === "preliminary") {
    if (now.getTime() < preliminary.getTime()) {
      return {
        resolvedType: null,
        watermark: preliminary,
        message: "Preliminary snapshot becomes available 5 minutes after contest end.",
      };
    }

    return {
      resolvedType: "PRELIMINARY_5M",
      watermark: preliminary,
      message: "Showing the preliminary (+5m) snapshot.",
    };
  }

  if (requestedPreference === "final") {
    if (now.getTime() < final.getTime()) {
      return {
        resolvedType: null,
        watermark: final,
        message: "Final snapshot becomes available 15 minutes after contest end.",
      };
    }

    return {
      resolvedType: "FINAL_15M",
      watermark: final,
      message: "Showing the final (+15m) snapshot.",
    };
  }

  if (now.getTime() >= final.getTime()) {
    return {
      resolvedType: "FINAL_15M",
      watermark: final,
      message: "Showing the latest available snapshot (final +15m).",
    };
  }

  if (now.getTime() >= preliminary.getTime()) {
    return {
      resolvedType: "PRELIMINARY_5M",
      watermark: preliminary,
      message: "Showing the latest available snapshot (preliminary +5m).",
    };
  }

  return {
    resolvedType: null,
    watermark: preliminary,
    message: "No snapshot is ready yet. Preliminary metrics unlock 5 minutes after contest end.",
  };
}

async function computeSnapshotRows(
  client: PrismaClient,
  contestId: string,
  selectedProblemId: string | null,
  snapshotType: SnapshotType,
  watermark: Date,
): Promise<{
  contestGroupRows: InstructorAnalysisSnapshot["contestGroupRows"];
  problemStudentRows: InstructorAnalysisSnapshot["problemStudentRows"];
}> {
  const contest = await client.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      startsAt: true,
      contestProblems: {
        orderBy: { ordering: "asc" },
        select: {
          problem: {
            select: {
              id: true,
            },
          },
        },
      },
      experimentGroups: {
        select: {
          groupName: true,
        },
      },
      participations: {
        select: {
          userId: true,
          role: true,
          experimentGroup: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
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
        select: {
          userId: true,
          problemId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!contest) {
    return {
      contestGroupRows: [],
      problemStudentRows: [],
    };
  }

  const computed = computeInstructorMetricsSnapshot(contest, snapshotType, watermark);

  return {
    contestGroupRows: computed.contestGroupRows.map((row) => ({
      groupName: row.groupName,
      solveRate: row.solveRate,
      meanSolveTimeSec: row.meanSolveTimeSec,
      medianSolveTimeSec: row.medianSolveTimeSec,
      attemptsToSolveMean: row.attemptsToSolveMean,
    })),
    problemStudentRows: computed.problemStudentRows
      .filter((row) => !selectedProblemId || row.problemId === selectedProblemId)
      .map((row) => {
        const participation = contest.participations.find(
          (entry) => entry.userId === row.studentId,
        );

        if (!participation) {
          return null;
        }

        return {
          studentId: row.studentId,
          studentName: `${participation.user.firstName} ${participation.user.lastName}`,
          groupName: row.groupName,
          timeToFirstSubmissionSec: row.timeToFirstSubmissionSec,
          timeToFirstCorrectSec: row.timeToFirstCorrectSec,
          postHintSolveProbability: row.postHintSolveProbability,
          attemptsBeforeHint: row.attemptsBeforeHint,
          attemptsAfterHint: row.attemptsAfterHint,
          timeToSolveAfterHintSec: row.timeToSolveAfterHintSec,
        };
      })
      .filter((row): row is InstructorAnalysisSnapshot["problemStudentRows"][number] => row !== null)
      .sort((left, right) => {
        if (left.groupName !== right.groupName) {
          return (left.groupName ?? "").localeCompare(right.groupName ?? "");
        }

        return left.studentName.localeCompare(right.studentName);
      }),
  };
}

export async function loadInstructorAnalysisSnapshot(
  client: PrismaClient,
  computingId: string,
  input: {
    contestId?: string;
    problemId?: string;
    snapshotPreference: SnapshotPreference;
  },
): Promise<InstructorAnalysisSnapshot | null> {
  const instructor = await client.user.findUnique({
    where: { computingId },
    select: {
      id: true,
      computingId: true,
    },
  });

  if (!instructor) {
    return null;
  }

  const contests = await client.contest.findMany({
    where: { instructorId: instructor.id },
    orderBy: [{ startsAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      startsAt: true,
      endsAt: true,
      contestProblems: {
        orderBy: { ordering: "asc" },
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
    },
  });

  if (contests.length === 0) {
    return {
      instructor,
      contests: [],
      selectedContestId: null,
      selectedProblemId: null,
      snapshot: {
        requestedPreference: input.snapshotPreference,
        resolvedType: null,
        status: "NOT_READY",
        watermark: null,
        computedAt: null,
        message: "No instructor contests are available yet.",
      },
      contestGroupRows: [],
      problemStudentRows: [],
    };
  }

  const selectedContest = contests.find((contest) => contest.id === input.contestId) ?? contests[0];
  const selectedContestId = selectedContest.id;
  const selectedProblemId =
    selectedContest.contestProblems.find((entry) => entry.problem.id === input.problemId)?.problem.id ??
    selectedContest.contestProblems[0]?.problem.id ??
    null;

  const snapshotResolution = resolveRequestedSnapshot(
    selectedContest.endsAt,
    input.snapshotPreference,
  );

  let runStatus: SnapshotRunStatus = "NOT_READY";
  let computedAt: Date | null = null;
  let contestGroupRows: InstructorAnalysisSnapshot["contestGroupRows"] = [];
  let problemStudentRows: InstructorAnalysisSnapshot["problemStudentRows"] = [];

  if (snapshotResolution.resolvedType && snapshotResolution.watermark) {
    try {
      const computed = await computeSnapshotRows(
        client,
        selectedContestId,
        selectedProblemId,
        snapshotResolution.resolvedType,
        snapshotResolution.watermark,
      );
      runStatus = "DONE";
      computedAt = new Date();
      contestGroupRows = computed.contestGroupRows;
      problemStudentRows = computed.problemStudentRows;
    } catch (error) {
      runStatus = "FAILED";
      snapshotResolution.message =
        error instanceof Error
          ? `Snapshot computation failed: ${error.message}`
          : "Snapshot computation failed.";
    }
  }

  return {
    instructor,
    contests,
    selectedContestId,
    selectedProblemId,
    snapshot: {
      requestedPreference: input.snapshotPreference,
      resolvedType: snapshotResolution.resolvedType,
      status: runStatus,
      watermark: snapshotResolution.watermark,
      computedAt,
      message: snapshotResolution.message,
    },
    contestGroupRows,
    problemStudentRows,
  };
}
