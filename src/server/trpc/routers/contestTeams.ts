import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getEffectiveContestStatus } from "@/lib/contestStatus";
import type { TeamInviteNotificationData } from "@/lib/notifications";
import { publishNotifications } from "@/server/notifications/publish";
import {
  ensureContestTeam,
  removeFromContestTeam,
  teamDisplayName,
  teamHasSubmissions,
  userHasContestSubmissions,
} from "@/server/teams/contestTeamService";
import { studentProcedure, router, type Context } from "../init";

// Everyone in a contest is on a team (a team of one by default). Teams grow only
// through invites the invitee accepts, and a team's results never move: people
// with submissions can't join another team, and a team with submissions can't be left.

const contestInput = z.object({
  contestId: z.string().min(1),
});

type StudentCtx = { prisma: Context["prisma"]; user: NonNullable<Context["user"]> };

const userNameSelect = { nickname: true, firstName: true, lastName: true, computingId: true } as const;

async function findStudentId(ctx: StudentCtx) {
  const student = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true },
  });
  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Student account not found." });
  }
  return student.id;
}

async function requireContestant(ctx: StudentCtx, contestId: string) {
  const studentId = await findStudentId(ctx);
  const participation = await ctx.prisma.participation.findUnique({
    where: { userId_contestId: { userId: studentId, contestId } },
    select: { role: true },
  });
  if (participation?.role !== "contestant") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Register for this contest to have a team.",
    });
  }
  return studentId;
}

function assertContestOpen(contest: Parameters<typeof getEffectiveContestStatus>[0]) {
  if (getEffectiveContestStatus(contest) === "ENDED") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This contest has ended." });
  }
}

const contestStatusSelect = {
  status: true,
  startsAt: true,
  endsAt: true,
  durationMinutes: true,
} as const;

export const contestTeamsRouter = router({
  get: studentProcedure.input(contestInput).query(async ({ ctx, input }) => {
    const studentId = await requireContestant(ctx, input.contestId);
    const teamId = await ctx.prisma.$transaction((tx) =>
      ensureContestTeam(tx, input.contestId, studentId),
    );

    const [contest, team, hasSubmissions, candidates] = await Promise.all([
      ctx.prisma.contest.findUniqueOrThrow({
        where: { id: input.contestId },
        select: { maxTeamSize: true, ...contestStatusSelect },
      }),
      ctx.prisma.team.findUniqueOrThrow({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          members: { select: { user: { select: { id: true, ...userNameSelect } } } },
          invites: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            select: { id: true, token: true, invitedUser: { select: userNameSelect } },
          },
        },
      }),
      ctx.prisma.submission.count({ where: { teamId } }).then((count) => count > 0),
      // Registered students who could still join: alone on their own team and
      // without submissions in this contest
      ctx.prisma.user.findMany({
        where: {
          role: "STUDENT",
          id: { not: studentId },
          participations: { some: { contestId: input.contestId, role: "contestant" } },
          submissions: { none: { contestId: input.contestId } },
          teamInvitesReceived: { none: { teamId, status: "PENDING" } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          email: true,
          ...userNameSelect,
          teamMemberships: {
            where: { contestId: input.contestId },
            select: { team: { select: { _count: { select: { members: true } } } } },
          },
        },
      }),
    ]);

    const openSpots = contest.maxTeamSize - team.members.length - team.invites.length;
    const contestOpen = getEffectiveContestStatus(contest) !== "ENDED";

    return {
      maxTeamSize: contest.maxTeamSize,
      team: {
        id: team.id,
        name: team.name,
        members: team.members.map(({ user }) => ({
          id: user.id,
          name: teamDisplayName(user),
          isYou: user.id === studentId,
        })),
        pendingInvites: team.invites.map((invite) => ({
          id: invite.id,
          token: invite.token,
          name: teamDisplayName(invite.invitedUser),
        })),
      },
      canInvite: contestOpen && openSpots > 0,
      canLeave: team.members.length > 1 && !hasSubmissions,
      invitableStudents: candidates
        .filter((candidate) => candidate.teamMemberships.every((m) => m.team._count.members === 1))
        .map((candidate) => ({
          id: candidate.id,
          name: teamDisplayName(candidate),
          email: candidate.email,
        })),
    };
  }),

  rename: studentProcedure
    .input(contestInput.extend({ name: z.string().trim().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await requireContestant(ctx, input.contestId);
      const teamId = await ctx.prisma.$transaction((tx) =>
        ensureContestTeam(tx, input.contestId, studentId),
      );
      await ctx.prisma.team.update({ where: { id: teamId }, data: { name: input.name } });
      return { ok: true };
    }),

  invite: studentProcedure
    .input(contestInput.extend({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await requireContestant(ctx, input.contestId);

      const { notification, token } = await ctx.prisma.$transaction(
        async (tx) => {
          const teamId = await ensureContestTeam(tx, input.contestId, studentId);
          const [contest, team, inviter, invitee] = await Promise.all([
            tx.contest.findUniqueOrThrow({
              where: { id: input.contestId },
              select: { name: true, maxTeamSize: true, ...contestStatusSelect },
            }),
            tx.team.findUniqueOrThrow({
              where: { id: teamId },
              select: {
                name: true,
                _count: { select: { members: true } },
                invites: { where: { status: "PENDING" }, select: { invitedUserId: true } },
              },
            }),
            tx.user.findUniqueOrThrow({ where: { id: studentId }, select: userNameSelect }),
            tx.participation.findUnique({
              where: { userId_contestId: { userId: input.userId, contestId: input.contestId } },
              select: { role: true },
            }),
          ]);

          assertContestOpen(contest);
          if (team._count.members + team.invites.length >= contest.maxTeamSize) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Your team is full." });
          }
          if (invitee?.role !== "contestant") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Only students registered for this contest can be invited.",
            });
          }
          if (team.invites.some((invite) => invite.invitedUserId === input.userId)) {
            throw new TRPCError({ code: "CONFLICT", message: "They already have an invite." });
          }
          if (await userHasContestSubmissions(tx, input.contestId, input.userId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "They've already submitted in this contest, so they stay on their own team.",
            });
          }

          const invite = await tx.teamInvite.create({
            data: {
              teamId,
              invitedUserId: input.userId,
              invitedById: studentId,
              token: randomBytes(24).toString("base64url"),
            },
            select: { token: true },
          });
          const notification = await tx.notification.create({
            data: {
              userId: input.userId,
              type: "TEAM_INVITE",
              contestId: input.contestId,
              data: {
                contestId: input.contestId,
                contestName: contest.name,
                teamName: team.name,
                invitedByName: teamDisplayName(inviter),
                token: invite.token,
              } satisfies TeamInviteNotificationData,
            },
          });
          return { notification, token: invite.token };
        },
        { isolationLevel: "Serializable" },
      );

      publishNotifications([notification]);
      return { token };
    }),

  revokeInvite: studentProcedure
    .input(contestInput.extend({ inviteId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await requireContestant(ctx, input.contestId);
      const membership = await ctx.prisma.teamMember.findUnique({
        where: { contestId_userId: { contestId: input.contestId, userId: studentId } },
        select: { teamId: true },
      });
      const { count } = await ctx.prisma.teamInvite.updateMany({
        where: { id: input.inviteId, teamId: membership?.teamId ?? "", status: "PENDING" },
        data: { status: "REVOKED", respondedAt: new Date() },
      });
      if (count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "That invite is no longer pending." });
      }
      return { ok: true };
    }),

  respondToInvite: studentProcedure
    .input(z.object({ token: z.string().min(1), accept: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const studentId = await findStudentId(ctx);

      return ctx.prisma.$transaction(
        async (tx) => {
          const invite = await tx.teamInvite.findUnique({
            where: { token: input.token },
            select: {
              id: true,
              status: true,
              invitedUserId: true,
              team: {
                select: {
                  id: true,
                  contestId: true,
                  _count: { select: { members: true } },
                  contest: { select: { maxTeamSize: true, ...contestStatusSelect } },
                },
              },
            },
          });
          if (!invite || invite.invitedUserId !== studentId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "This invite isn't for your account." });
          }
          if (invite.status !== "PENDING") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "This invite is no longer pending." });
          }

          const respondedAt = new Date();
          if (!input.accept) {
            await tx.teamInvite.update({
              where: { id: invite.id },
              data: { status: "DECLINED", respondedAt },
            });
            return { contestId: invite.team.contestId, joined: false };
          }

          const { contest } = invite.team;
          const contestId = invite.team.contestId;
          if (!contest || !contestId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "This team isn't part of a contest." });
          }
          assertContestOpen(contest);
          if (invite.team._count.members >= contest.maxTeamSize) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "That team is already full." });
          }
          if (await userHasContestSubmissions(tx, contestId, studentId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You've already submitted in this contest, so your results stay with your current team.",
            });
          }

          const current = await tx.teamMember.findUnique({
            where: { contestId_userId: { contestId, userId: studentId } },
            select: { team: { select: { _count: { select: { members: true } } } } },
          });
          if (current && current.team._count.members > 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Leave your current team before joining another.",
            });
          }
          // Your empty team of one gives way to the new team
          await removeFromContestTeam(tx, contestId, studentId);

          const participation = await tx.participation.findUnique({
            where: { userId_contestId: { userId: studentId, contestId } },
            select: { role: true },
          });
          if (!participation) {
            await tx.participation.create({
              data: { userId: studentId, contestId, role: "contestant" },
            });
            await tx.contest.update({
              where: { id: contestId },
              data: { participants: { increment: 1 } },
            });
          }

          await tx.teamMember.create({
            data: { teamId: invite.team.id, userId: studentId, contestId },
          });
          await tx.teamInvite.update({
            where: { id: invite.id },
            data: { status: "ACCEPTED", respondedAt },
          });
          // You can be on only one team, so your other invites for this contest lapse
          await tx.teamInvite.updateMany({
            where: {
              invitedUserId: studentId,
              status: "PENDING",
              team: { contestId },
            },
            data: { status: "REVOKED", respondedAt },
          });

          return { contestId, joined: true };
        },
        { isolationLevel: "Serializable" },
      );
    }),

  leave: studentProcedure.input(contestInput).mutation(async ({ ctx, input }) => {
    const studentId = await requireContestant(ctx, input.contestId);

    await ctx.prisma.$transaction(
      async (tx) => {
        const teamId = await ensureContestTeam(tx, input.contestId, studentId);
        const members = await tx.teamMember.count({ where: { teamId } });
        if (members < 2) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You're the only one on your team." });
        }
        if (await teamHasSubmissions(tx, teamId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your team has submissions, so its members stay together.",
          });
        }
        await removeFromContestTeam(tx, input.contestId, studentId);
        // Back to a team of one
        await ensureContestTeam(tx, input.contestId, studentId);
      },
      { isolationLevel: "Serializable" },
    );
    return { ok: true };
  }),
});
