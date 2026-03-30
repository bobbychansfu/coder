import { prisma } from "./prisma";
import { UserRole, SubmissionStatus, CodingLanguage } from "@prisma/client";

export const dbHelpers = {
  // ********************
  // SELECTS
  // ********************
  findUserByComputingId: async (computingId: string) => {
    return prisma.user.findUnique({
      where: { computingId },
    });
  },

  findProblem: async (problemId: string) => {
    return prisma.problem.findFirst({
      where: {
        id: problemId,
        isDraft: false,
        manageStatus: "ACTIVE",
      },
    });
  },

  findProblemWithDetails: async (problemId: string) => {
    return prisma.problem.findFirst({
      where: {
        id: problemId,
        isDraft: false,
        manageStatus: "ACTIVE",
      },
      include: {
        topics: {
          select: {
            name: true,
          },
          orderBy: { name: "asc" },
        },
        starterCodes: {
          select: {
            language: true,
            code: true,
          },
          orderBy: { language: "asc" },
        },
      },
    });
  },

  findProblemByCode: async (code: string) => {
    return prisma.problem.findFirst({
      where: {
        code,
        isDraft: false,
        manageStatus: "ACTIVE",
      },
    });
  },

  findContestsForUser: async (computingId: string, role: string) => {
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        status: {
          not: "DRAFT",
        },
        participations: {
          some: {
            user: { computingId },
            role: role,
          },
        },
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contests.map(({ participations, ...contest }) => ({
      ...contest,
      participants: participations.filter((participation) => participation.role === "contestant").length,
    }));
  },

  findSpecificContestForUser: async (computingId: string, contestId: string, role: string) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
        participations: {
          some: {
            user: { computingId },
            role: role,
          },
        },
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
    });

    if (!contest) {
      return null;
    }

    const { participations, ...contestRecord } = contest;

    return {
      ...contestRecord,
      participants: participations.filter((participation) => participation.role === "contestant").length,
    };
  },

  findOpenContestsForUser: async (computingId: string, role: string) => {
    // Finds published, non-draft contests where the user is NOT participating
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        status: {
          not: "DRAFT",
        },
        participations: {
          none: {
            user: { computingId },
            role: role,
          },
        },
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contests.map(({ participations, ...contest }) => ({
      ...contest,
      participants: participations.filter((participation) => participation.role === "contestant").length,
    }));
  },

  findContest: async (contestId: string) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
    });

    if (!contest) {
      return null;
    }

    const { participations, ...contestRecord } = contest;

    return {
      ...contestRecord,
      participants: participations.filter((participation) => participation.role === "contestant").length,
    };
  },

  findContestsProblemsStatusForUser: async (computingId: string, contestId: string) => {
    return prisma.contestProblem.findMany({
      where: {
        contestId,
        contest: { manageStatus: "ACTIVE" },
        problem: { isDraft: false, manageStatus: "ACTIVE" },
      },
      include: {
        problem: {
          include: {
            problemStatuses: {
              where: {
                user: { computingId },
                contestId,
              },
            },
          },
        },
      },
      orderBy: { ordering: "asc" },
    });
  },

  getProblemsForContest: async (contestId: string) => {
    return prisma.contestProblem.findMany({
      where: {
        contestId,
        contest: { manageStatus: "ACTIVE" },
        problem: { isDraft: false, manageStatus: "ACTIVE" },
      },
      include: { problem: true },
      orderBy: { ordering: "asc" },
    });
  },

  findStartTime: async (contestId: string) => {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { startsAt: true },
    });
    return contest?.startsAt;
  },

  findAllContestantsForContest: async (contestId: string) => {
    return prisma.participation.findMany({
      where: { contestId, role: "contestant" },
      include: {
        user: {
          select: { computingId: true, nickname: true },
        },
      },
    });
  },

  findProblemStatus: async (computingId: string, contestId: string, problemId: string) => {
    return prisma.problemStatus.findFirst({
      where: {
        user: { computingId },
        contestId,
        problemId,
      },
    });
  },

  findSubmission: async (submissionId: string) => {
    return prisma.submission.findUnique({
      where: { id: submissionId },
    });
  },

  findSubmissionsForProblem: async (computingId: string, contestId: string, problemId: string) => {
    return prisma.submission.findMany({
      where: {
        user: { computingId },
        contestId,
        problemId,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findAllSubmissions: async (computingId: string) => {
    return prisma.submission.findMany({
      where: { user: { computingId } },
      include: { problem: true },
    });
  },
  getTopicXp: async (computingId: string) => {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { user: { computingId } },
      include: { achievement: true },
    });

    const topicXp: Record<string, number> = {};
    userAchievements.forEach((ua) => {
      const tid = ua.achievement.topicId || "unknown";
      topicXp[tid] = (topicXp[tid] || 0) + ua.achievement.xpReward;
    });

    return Object.entries(topicXp).map(([topic_id, x]) => ({ topic_id, x }));
  },

  getTotalProblemXp: async (computingId: string) => {
    const topicXp = await dbHelpers.getTopicXp(computingId);
    return topicXp.reduce((sum, row) => sum + row.x, 0);
  },

  getStudentAchievements: async (computingId: string) => {
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { id: "asc" },
    });
    const earnedAchievements = await prisma.userAchievement.findMany({
      where: { user: { computingId } },
    });
    const earnedSet = new Set(earnedAchievements.map((ua) => ua.achievementId));

    return allAchievements.map((a) => ({
      ...a,
      earned: earnedSet.has(a.id),
      earned_at: earnedAchievements.find((ua) => ua.achievementId === a.id)?.earnedAt,
    }));
  },

  // ********************
  // UPDATES AND INSERTS
  // ********************

  insertUser: async (data: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    computingId: string;
    role: UserRole;
    nickname?: string;
    email: string;
  }) => {
    return prisma.user.upsert({
      where: { computingId: data.computingId },
      update: {},
      create: {
        firstName: data.firstName,
        lastName: data.lastName,
        studentNumber: data.studentNumber,
        computingId: data.computingId,
        role: data.role,
        nickname: data.nickname,
        email: data.email,
      },
    });
  },

  insertParticipate: async (computingId: string, contestId: string, role: string) => {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { computingId },
        select: { id: true },
      });
      if (!user) throw new Error("User not found");

      const existingParticipation = await tx.participation.findUnique({
        where: {
          userId_contestId: {
            userId: user.id,
            contestId,
          },
        },
      });

      if (existingParticipation) {
        return existingParticipation;
      }

      const participation = await tx.participation.create({
        data: {
          userId: user.id,
          contestId,
          role,
        },
      });

      if (role === "contestant") {
        await tx.contest.update({
          where: { id: contestId },
          data: {
            participants: { increment: 1 },
          },
        });
      }

      return participation;
    });
  },

  removeParticipate: async (computingId: string, contestId: string, _role: string) => {
    void _role;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { computingId },
        select: { id: true },
      });
      if (!user) throw new Error("User not found");

      const existingParticipation = await tx.participation.findUnique({
        where: {
          userId_contestId: {
            userId: user.id,
            contestId,
          },
        },
      });

      if (!existingParticipation) {
        return null;
      }

      await tx.participation.delete({
        where: {
          userId_contestId: {
            userId: user.id,
            contestId,
          },
        },
      });

      if (existingParticipation.role === "contestant") {
        const contest = await tx.contest.findUnique({
          where: { id: contestId },
          select: { participants: true },
        });

        if (contest && contest.participants > 0) {
          await tx.contest.update({
            where: { id: contestId },
            data: {
              participants: { decrement: 1 },
            },
          });
        }
      }

      return existingParticipation;
    });
  },

  updateUser: async (computingId: string, data: {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    nickname?: string;
    studentNumber?: string;
  }) => {
    return prisma.user.update({
      where: { computingId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        nickname: data.nickname,
        studentNumber: data.studentNumber,
      },
    });
  },

  incrementCompetitionsParticipated: async (computingId: string) => {
    return prisma.user.update({
      where: { computingId },
      data: { competitionsParticipated: { increment: 1 } },
    });
  },

  updateUserPointsAndProblems: async (computingId: string, points: number, problemsSolved: number) => {
    return prisma.user.update({
      where: { computingId },
      data: {
        pointsAcquired: { increment: points },
        problemsSolved: { increment: problemsSolved },
      },
    });
  },

  updateUserRank: async (computingId: string, rank: string) => {
    return prisma.user.update({
      where: { computingId },
      data: { rank },
    });
  },

  getUserActivities: async (computingId: string) => {
    return prisma.userActivity.findMany({
      where: { user: { computingId } },
    });
  },

  addNewActivity: async (computingId: string, type: string, name: string) => {
    const user = await dbHelpers.findUserByComputingId(computingId);
    if (!user) throw new Error("User not found");

    return prisma.userActivity.create({
      data: {
        userId: user.id,
        type,
        name,
      },
    });
  },

  createSubmission: async (data: {
    computingId: string;
    contestId: string;
    problemId: string;
    submission: string;
    language: CodingLanguage;
  }) => {
    const user = await dbHelpers.findUserByComputingId(data.computingId);
    if (!user) throw new Error("User not found");

    return prisma.submission.create({
      data: {
        userId: user.id,
        contestId: data.contestId,
        problemId: data.problemId,
        submission: data.submission,
        language: data.language,
        status: "PENDING",
      },
    });
  },

  createProblemStatus: async (computingId: string, contestId: string, problemId: string) => {
    const user = await dbHelpers.findUserByComputingId(computingId);
    if (!user) throw new Error("User not found");

    return prisma.problemStatus.upsert({
      where: {
        userId_contestId_problemId: {
          userId: user.id,
          contestId,
          problemId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        contestId,
        problemId,
      },
    });
  },

  updateProblemStatus: async (
    computingId: string,
    contestId: string,
    problemId: string,
    data: { status?: string; score?: number; tries?: number }
  ) => {
    const user = await dbHelpers.findUserByComputingId(computingId);
    if (!user) throw new Error("User not found");

    return prisma.problemStatus.update({
      where: {
        userId_contestId_problemId: {
          userId: user.id,
          contestId,
          problemId,
        },
      },
      data: {
        status: data.status,
        score: data.score,
        tries: data.tries !== undefined ? { increment: data.tries } : undefined,
      },
    });
  },

  updateSubmission: async (
    submissionId: string,
    status: SubmissionStatus,
    judgeOutput: string,
    score: number
  ) => {
    return prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        judgeOutput,
        score,
      },
    });
  },

  getAllHints: async (computingId: string, problemId: string) => {
    return prisma.hint.findMany({
      where: {
        user: { computingId },
        problemId,
      },
      orderBy: { hintNum: "asc" },
    });
  },

  getReleventSolvedProblems: async (computingId: string, problemId: string) => {
    const problemTopics = await prisma.topic.findMany({
      where: { problemId },
    });

    if (problemTopics.length === 0) return null;

    const topicNames = problemTopics.map((t) => t.name);

    return prisma.submission.findMany({
      where: {
        user: { computingId },
        problem: {
          topics: {
            some: {
              name: { in: topicNames },
            },
          },
          problemStatuses: {
            some: {
              user: { computingId },
              status: "correct",
            },
          },
        },
      },
      include: {
        problem: {
          select: {
            statement: true,
          },
        },
      },
    });
  },

  getProblemTopic: async (problemId: string) => {
    return prisma.topic.findMany({
      where: { problemId },
      select: { name: true },
    });
  },
};




