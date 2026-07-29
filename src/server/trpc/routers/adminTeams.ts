import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../init";

const createGroupsInput = z.object({
  groupSize: z.number().int().min(2).max(20),
  namePrefix: z.string().trim().min(1).max(40).default("Group"),
});

const deleteGroupsInput = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("all") }),
  z.object({ scope: z.literal("selected"), teamIds: z.array(z.string()).min(1).max(100) }),
]);

const updateTeamMembersInput = z.object({
  teamId: z.string().min(1),
  userIds: z.array(z.string()).max(200),
});

function shuffled<T>(values: T[]): T[] {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}

export const adminTeamsRouter = router({
  summary: adminProcedure.query(async ({ ctx }) => {
    const [studentCount, users] = await Promise.all([
      ctx.prisma.user.count({ where: { role: "STUDENT" } }),
      ctx.prisma.user.findMany({
        where: { role: { not: "GUEST" } },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          computingId: true,
          role: true,
          nickname: true,
          studentNumber: true,
          pointsAcquired: true,
          problemsSolved: true,
          competitionsParticipated: true,
          rank: true,
          updatedAt: true,
          participations: {
            select: { contestId: true },
          },
        },
      }),
    ]);

    let groupedStudentCount = 0;
    let teamCount = 0;
    let teamsAvailable = true;
    let teams: Array<{
      id: string;
      name: string;
      createdAt: string;
      members: Array<{
        id: string;
        userId: string;
        name: string;
        email: string;
        computingId: string;
      }>;
    }> = [];

    try {
      const [groupedCount, count, teamRecords] = await Promise.all([
        ctx.prisma.user.count({
          where: {
            role: "STUDENT",
            teamMemberships: {
              some: {
                team: { contestId: null },
              },
            },
          },
        }),
        ctx.prisma.team.count({ where: { contestId: null } }),
        ctx.prisma.team.findMany({
          where: { contestId: null },
          orderBy: [{ createdAt: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            createdAt: true,
            members: {
              orderBy: { user: { firstName: "asc" } },
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    computingId: true,
                  },
                },
              },
            },
          },
        }),
      ]);
      groupedStudentCount = groupedCount;
      teamCount = count;
      teams = teamRecords.map((team) => ({
        id: team.id,
        name: team.name,
        createdAt: team.createdAt.toISOString(),
        members: team.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: `${member.user.firstName} ${member.user.lastName}`.trim(),
          email: member.user.email,
          computingId: member.user.computingId,
        })),
      }));
    } catch (error) {
      teamsAvailable = false;
      console.error("[admin-teams] Team tables are unavailable", error);
    }

    return {
      studentCount,
      groupedStudentCount,
      ungroupedStudentCount: studentCount - groupedStudentCount,
      teamCount,
      teamsAvailable,
      teams,
      users: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        computingId: user.computingId,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        studentNumber: user.studentNumber,
        databaseRole: user.role,
        pointsAcquired: user.pointsAcquired,
        problemsSolved: user.problemsSolved,
        competitionsParticipated: user.competitionsParticipated,
        rank: user.rank,
        isCurrentUser: user.computingId === ctx.user.computingId,
        role:
          user.role === "STUDENT"
            ? ("student" as const)
            : user.role === "ADMIN"
              ? ("admin" as const)
              : ("instructor" as const),
        courses: new Set(user.participations.map((item) => item.contestId)).size,
        lastActive: user.updatedAt.toISOString(),
      })),
    };
  }),

  createGroups: adminProcedure
    .input(createGroupsInput)
    .mutation(async ({ ctx, input }) => {
      const students = await ctx.prisma.user.findMany({
        where: {
          role: "STUDENT",
          teamMemberships: {
            none: {
              team: { contestId: null },
            },
          },
        },
        select: { id: true },
        orderBy: { computingId: "asc" },
      });

      if (students.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There are no ungrouped students to assign.",
        });
      }

      const existingTeamCount = await ctx.prisma.team.count({ where: { contestId: null } });
      const randomizedStudents = shuffled(students);
      const groupCount = Math.ceil(randomizedStudents.length / input.groupSize);
      const groups = Array.from({ length: groupCount }, () => [] as typeof students);

      randomizedStudents.forEach((student, index) => {
        groups[index % groupCount].push(student);
      });

      const createdTeams = await ctx.prisma.$transaction(
        groups.map((members, groupIndex) =>
          ctx.prisma.team.create({
            data: {
              name: `${input.namePrefix} ${existingTeamCount + groupIndex + 1}`,
              members: {
                create: members.map((student) => ({ userId: student.id })),
              },
            },
            select: {
              id: true,
              name: true,
              members: { select: { userId: true } },
            },
          }),
        ),
      );

      return {
        teamsCreated: createdTeams.length,
        studentsAssigned: createdTeams.reduce(
          (total, team) => total + team.members.length,
          0,
        ),
      };
    }),

  deleteGroups: adminProcedure
    .input(deleteGroupsInput)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.team.deleteMany({
        where:
          input.scope === "all"
            ? { contestId: null }
            : { id: { in: input.teamIds }, contestId: null },
      });

      return { teamsDeleted: result.count };
    }),

  updateMembers: adminProcedure
    .input(updateTeamMembersInput)
    .mutation(async ({ ctx, input }) => {
      const userIds = [...new Set(input.userIds)];

      const result = await ctx.prisma.$transaction(async (tx) => {
        const [team, students, conflictingMembership] = await Promise.all([
          tx.team.findFirst({
            where: { id: input.teamId, contestId: null },
            select: { id: true },
          }),
          tx.user.findMany({
            where: { id: { in: userIds }, role: "STUDENT" },
            select: { id: true },
          }),
          tx.teamMember.findFirst({
            where: {
              userId: { in: userIds },
              teamId: { not: input.teamId },
              team: { contestId: null },
            },
            select: { id: true },
          }),
        ]);

        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found." });
        }

        if (students.length !== userIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more selected users are not students.",
          });
        }

        if (conflictingMembership) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "One or more selected students have already been assigned to another group.",
          });
        }

        await tx.teamMember.deleteMany({ where: { teamId: input.teamId } });

        if (userIds.length > 0) {
          await tx.teamMember.createMany({
            data: userIds.map((userId) => ({ teamId: input.teamId, userId })),
          });
        }

        return { membersUpdated: userIds.length };
      });

      return result;
    }),
});
