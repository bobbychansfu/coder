import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { studentProcedure, router, type Context } from "../init";

const contestInput = z.object({
  contestId: z.string().min(1),
});

const createContestTeamInput = contestInput.extend({
  name: z.string().trim().min(1).max(50),
  memberUserIds: z.array(z.string().min(1)).length(2),
});

async function getStudentContext(
  ctx: { prisma: Context["prisma"]; user: NonNullable<Context["user"]> },
  contestId: string,
) {
  const student = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true },
  });

  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Student account not found." });
  }

  const participation = await ctx.prisma.participation.findUnique({
    where: {
      userId_contestId: {
        userId: student.id,
        contestId,
      },
    },
    select: { role: true },
  });

  if (!participation || participation.role !== "contestant") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be registered for this contest to create a team.",
    });
  }

  return student;
}

export const contestTeamsRouter = router({
  get: studentProcedure.input(contestInput).query(async ({ ctx, input }) => {
    const student = await getStudentContext(ctx, input.contestId);

    const [currentMembership, candidates] = await Promise.all([
      ctx.prisma.teamMember.findFirst({
        where: {
          userId: student.id,
          team: { contestId: input.contestId },
        },
        select: {
          team: {
            select: {
              id: true,
              name: true,
              members: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      computingId: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      ctx.prisma.user.findMany({
        where: {
          role: "STUDENT",
          id: { not: student.id },
          participations: {
            some: {
              contestId: input.contestId,
              role: "contestant",
            },
          },
          teamMemberships: {
            none: {
              team: { contestId: input.contestId },
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          computingId: true,
          email: true,
        },
      }),
    ]);

    return {
      currentTeam: currentMembership
        ? {
            id: currentMembership.team.id,
            name: currentMembership.team.name,
            members: currentMembership.team.members.map(({ user }) => ({
              id: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
              computingId: user.computingId,
            })),
          }
        : null,
      availableStudents: candidates.map((candidate) => ({
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`.trim(),
        computingId: candidate.computingId,
        email: candidate.email,
      })),
    };
  }),

  create: studentProcedure
    .input(createContestTeamInput)
    .mutation(async ({ ctx, input }) => {
      if (new Set(input.memberUserIds).size !== 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select two different students.",
        });
      }

      const creator = await getStudentContext(ctx, input.contestId);
      const allMemberIds = [creator.id, ...input.memberUserIds];

      return ctx.prisma.$transaction(
        async (tx) => {
          const [eligibleStudents, existingMembership] = await Promise.all([
            tx.user.count({
              where: {
                id: { in: allMemberIds },
                role: "STUDENT",
                participations: {
                  some: {
                    contestId: input.contestId,
                    role: "contestant",
                  },
                },
              },
            }),
            tx.teamMember.findFirst({
              where: {
                userId: { in: allMemberIds },
                team: { contestId: input.contestId },
              },
              select: { id: true },
            }),
          ]);

          if (eligibleStudents !== 3) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Every team member must be a registered student in this contest.",
            });
          }

          if (existingMembership) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "One of the selected students is already in a team.",
            });
          }

          const team = await tx.team.create({
            data: {
              name: input.name,
              contestId: input.contestId,
              members: {
                create: allMemberIds.map((userId) => ({ userId })),
              },
            },
            select: { id: true, name: true },
          });

          return { ...team, memberCount: 3 };
        },
        { isolationLevel: "Serializable" },
      );
    }),
});
