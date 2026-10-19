import { prisma } from "./prisma";
import { UserRole, SubmissionStatus, CodingLanguage, type Prisma } from "@prisma/client";
import { allowlistEntryFor, allowlistIdentifiersFor } from "./contestAllowlist";
import {
  getEffectiveContestStatus,
  isJoinableContestStatus,
  resolveContestEndTimestamp,
} from "./contestStatus";
import { buildIcpcStandings } from "./icpcStandings";
import {
  ensureContestTeam,
  removeFromContestTeam,
  userHasContestSubmissions,
} from "@/server/teams/contestTeamService";
import { buildPointsStandings } from "./pointsStandings";

function groupByUserId<T extends { userId: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const existing = grouped.get(row.userId) ?? [];
    existing.push(row);
    grouped.set(row.userId, existing);
  }
  return grouped;
}

const NON_PRIVATE_CONTEST_VISIBILITY = { not: "PRIVATE" as const };

// Matches private contests whose allowlist names this user
async function allowlistedContestFilter(computingId: string): Promise<Prisma.ContestWhereInput> {
  const user = await prisma.user.findUnique({
    where: { computingId },
    select: { computingId: true, email: true },
  });
  const identifiers = user ? allowlistIdentifiersFor(user) : [computingId.toLowerCase()];

  return { allowedUsers: { some: { identifier: { in: identifiers } } } };
}

// Contests a student may see: every non-private one, plus private ones that allowlist them
async function studentVisibleContestFilter(computingId: string): Promise<Prisma.ContestWhereInput> {
  return {
    OR: [
      { visibility: NON_PRIVATE_CONTEST_VISIBILITY },
      await allowlistedContestFilter(computingId),
    ],
  };
}

function withParticipantCount<T extends { participations: Array<{ role: string }> }>(
  contest: T,
) {
  const { participations, ...contestRecord } = contest;

  return {
    ...contestRecord,
    participants: participations.filter((participation) => participation.role === "contestant").length,
  };
}

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
        ...(await studentVisibleContestFilter(computingId)),
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

    return contests.map(withParticipantCount);
  },

  findPublishedContests: async () => {
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        status: {
          not: "DRAFT",
        },
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contests.map(withParticipantCount);
  },

  findPublishedContestsForViewer: async (computingId: string, viewerRole: string) => {
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        status: {
          not: "DRAFT",
        },
        ...(viewerRole === "admin"
          ? {}
          : {
              OR: [
                { visibility: NON_PRIVATE_CONTEST_VISIBILITY },
                { instructor: { is: { computingId } } },
                await allowlistedContestFilter(computingId),
              ],
            }),
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contests.map(withParticipantCount);
  },

  findSpecificContestForUser: async (computingId: string, contestId: string, role: string) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
        ...(await studentVisibleContestFilter(computingId)),
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

    return withParticipantCount(contest);
  },

  // A contest a student may open: one they registered for, or an ended one its setter
  // opened to every student for upsolving
  findViewableContestForStudent: async (computingId: string, contestId: string) => {
    return (
      (await dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant")) ??
      (await dbHelpers.findContestOpenForUpsolving(contestId))
    );
  },

  findContestOpenForUpsolving: async (contestId: string) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
        published: true,
        status: { not: "DRAFT" },
        openForUpsolving: true,
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
    });

    return contest && getEffectiveContestStatus(contest) === "ENDED"
      ? withParticipantCount(contest)
      : null;
  },

  // Ended contests opened for upsolving that this student never registered for
  findUpsolvingContestsForUser: async (computingId: string) => {
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        status: { not: "DRAFT" },
        openForUpsolving: true,
        participations: { none: { user: { computingId }, role: "contestant" } },
      },
      include: {
        participations: {
          select: { role: true },
        },
      },
    });

    return contests
      .filter((contest) => getEffectiveContestStatus(contest) === "ENDED")
      .map(withParticipantCount);
  },

  findOpenContestsForUser: async (computingId: string, role: string) => {
    // Finds contests students can still join.
    const contests = await prisma.contest.findMany({
      where: {
        manageStatus: "ACTIVE",
        published: true,
        ...(await studentVisibleContestFilter(computingId)),
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

    return contests
      .map(withParticipantCount)
      .filter((contest) => isJoinableContestStatus(getEffectiveContestStatus(contest)));
  },

  // A join link's code also opens a private contest to someone not on its allowlist
  findJoinableContestForUser: async (
    computingId: string,
    contestId: string,
    role: string,
    joinCode?: string,
  ) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
        published: true,
        OR: [
          { visibility: NON_PRIVATE_CONTEST_VISIBILITY },
          await allowlistedContestFilter(computingId),
          ...(joinCode ? [{ joinCode }] : []),
        ],
        participations: {
          none: {
            user: { computingId },
            role,
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

    const contestRecord = withParticipantCount(contest);

    return isJoinableContestStatus(getEffectiveContestStatus(contestRecord))
      ? contestRecord
      : null;
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

    return withParticipantCount(contest);
  },

  findContestForViewer: async (contestId: string, computingId: string, viewerRole: string) => {
    const contest = await prisma.contest.findFirst({
      where: {
        id: contestId,
        manageStatus: "ACTIVE",
        ...(viewerRole === "admin"
          ? {}
          : {
              OR: [
                { visibility: NON_PRIVATE_CONTEST_VISIBILITY },
                { instructor: { is: { computingId } } },
                await allowlistedContestFilter(computingId),
              ],
            }),
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

    return withParticipantCount(contest);
  },

  findContestsProblemsStatusForUser: async (computingId: string, contestId: string) => {
    const [contest, rows] = await Promise.all([
      prisma.contest.findUnique({ where: { id: contestId }, select: { showDifficulty: true } }),
      prisma.contestProblem.findMany({
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
      }),
    ]);

    // Strip difficulty server-side so a hidden value never reaches the browser.
    return rows.map((row) => ({
      ...row,
      problem: {
        ...row.problem,
        difficulty: contest?.showDifficulty ? row.problem.difficulty : null,
      },
    }));
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
          select: { computingId: true, nickname: true, firstName: true, lastName: true },
        },
      },
    });
  },

  findScoreboardRowsForContest: async (contestId: string, viewerComputingId?: string) => {
    const [contest, contestProblems, contestants, teams] = await Promise.all([
      prisma.contest.findFirst({
        where: { id: contestId, manageStatus: "ACTIVE" },
        select: { scoringRule: true, status: true, startsAt: true, endsAt: true, durationMinutes: true },
      }),
      prisma.contestProblem.findMany({
        where: {
          contestId,
          contest: { manageStatus: "ACTIVE" },
          problem: { isDraft: false, manageStatus: "ACTIVE" },
        },
        select: {
          problemId: true,
          ordering: true,
        },
        orderBy: { ordering: "asc" },
      }),
      prisma.participation.findMany({
        where: { contestId, role: "contestant" },
        select: {
          userId: true,
          user: {
            select: {
              computingId: true,
              nickname: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.team.findMany({
        where: { contestId },
        select: { id: true, name: true, members: { select: { userId: true } } },
      }),
    ]);

    if (!contest) {
      return [];
    }

    type Contestant = (typeof contestants)[number];
    const displayNameOf = (contestant: Contestant) =>
      contestant.user.nickname?.trim() ||
      `${contestant.user.firstName} ${contestant.user.lastName}`.trim() ||
      contestant.user.computingId;

    // Every contestant is on a team (a team of one by default), ranked as one entry.
    // A contestant somehow without a team still gets a row keyed by their user id.
    const teamByUserId = new Map<string, { id: string; name: string }>();
    for (const team of teams) {
      for (const member of team.members) {
        teamByUserId.set(member.userId, { id: team.id, name: team.name });
      }
    }

    const entries = new Map<string, { teamName: string | null; members: Contestant[] }>();
    for (const contestant of contestants) {
      const team = teamByUserId.get(contestant.userId);
      const key = team ? team.id : `user:${contestant.userId}`;
      const entry = entries.get(key) ?? { teamName: team?.name ?? null, members: [] };
      entry.members.push(contestant);
      entries.set(key, entry);
    }

    const problems = contestProblems.map((problem, index) => ({
      problemId: problem.problemId,
      code: String.fromCharCode(65 + index),
    }));
    const rankedEntries = [...entries.entries()].map(([key, entry]) => {
      const memberNames = entry.members.map(displayNameOf).sort((a, b) => a.localeCompare(b));
      return {
        key,
        name: entry.teamName ?? memberNames[0],
        // A team of one is just its member, so list members only for real teams
        members: memberNames.length > 1 ? memberNames : undefined,
        isCurrentUser: entry.members.some((member) => member.user.computingId === viewerComputingId),
        userIds: entry.members.map((member) => member.userId),
      };
    });

    if (contest.scoringRule === "ICPC") {
      // Each submission counts for the team it was made for; rows from before teams
      // were recorded fall back to the submitter's current team.
      const submissions = await prisma.submission.findMany({
        where: { contestId },
        select: { userId: true, teamId: true, problemId: true, status: true, createdAt: true },
      });
      const submissionsByEntry = new Map<string, typeof submissions>();
      for (const submission of submissions) {
        const key =
          submission.teamId ?? teamByUserId.get(submission.userId)?.id ?? `user:${submission.userId}`;
        const list = submissionsByEntry.get(key) ?? [];
        list.push(submission);
        submissionsByEntry.set(key, list);
      }
      return buildIcpcStandings({
        problems,
        entries: rankedEntries.map((entry) => ({
          name: entry.name,
          members: entry.members,
          isCurrentUser: entry.isCurrentUser,
          submissions: submissionsByEntry.get(entry.key) ?? [],
        })),
        startsAt: contest.startsAt,
        endsAt: resolveContestEndTimestamp(contest),
      });
    }

    const statuses = await prisma.problemStatus.findMany({
      where: { contestId },
      select: { userId: true, problemId: true, status: true, score: true },
    });
    const statusesByUserId = groupByUserId(statuses);
    return buildPointsStandings({
      problems,
      entries: rankedEntries.map((entry) => ({
        name: entry.name,
        members: entry.members,
        isCurrentUser: entry.isCurrentUser,
        statuses: entry.userIds.flatMap((userId) => statusesByUserId.get(userId) ?? []),
      })),
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

  // Joining through a link puts you on the allowlist unless it already names you
  addToContestAllowlist: async (computingId: string, contestId: string) => {
    const user = await prisma.user.findUnique({
      where: { computingId },
      select: { computingId: true, email: true },
    });
    if (!user) throw new Error("User not found");

    const listed = await prisma.contestAllowedUser.findFirst({
      where: { contestId, identifier: { in: allowlistIdentifiersFor(user) } },
      select: { identifier: true },
    });
    if (listed) {
      return;
    }

    await prisma.contestAllowedUser.createMany({
      data: [{ contestId, identifier: allowlistEntryFor(user) }],
      skipDuplicates: true,
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
        // Registering puts you on a team of one; invites can grow it later
        await ensureContestTeam(tx, contestId, user.id);
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

      // Results stay with the team; only someone who never submitted leaves it
      if (!(await userHasContestSubmissions(tx, contestId, user.id))) {
        await removeFromContestTeam(tx, contestId, user.id);
      }

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
    nickname?: string | null;
    studentNumber?: string | null;
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

    return prisma.$transaction(async (tx) => {
      // Stamped now, so the result stays with this team whatever changes later. Someone
      // upsolving a contest they never registered for gets no team.
      const participation = await tx.participation.findUnique({
        where: { userId_contestId: { userId: user.id, contestId: data.contestId } },
        select: { role: true },
      });
      const teamId =
        participation?.role === "contestant"
          ? await ensureContestTeam(tx, data.contestId, user.id)
          : null;
      return tx.submission.create({
        data: {
          userId: user.id,
          contestId: data.contestId,
          problemId: data.problemId,
          teamId,
          submission: data.submission,
          language: data.language,
          status: "PENDING",
        },
      });
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

