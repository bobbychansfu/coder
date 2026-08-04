import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../init";

const userRoleSchema = z.enum(["ADMIN", "INSTRUCTOR", "TA", "STUDENT"]);

const updateUserInput = z.object({
  id: z.string().min(1),
  computingId: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  nickname: z.string().trim().max(40).nullable(),
  studentNumber: z.string().trim().max(20).nullable(),
  role: userRoleSchema,
  pointsAcquired: z.number().int().min(0),
  problemsSolved: z.number().int().min(0),
  competitionsParticipated: z.number().int().min(0),
  rank: z.string().trim().max(40).nullable(),
});

export const adminUsersRouter = router({
  update: adminProcedure.input(updateUserInput).mutation(async ({ ctx, input }) => {
    const [currentAdmin, target] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { computingId: ctx.user.computingId },
        select: { id: true, computingId: true },
      }),
      ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: { id: true, role: true },
      }),
    ]);

    if (!target) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    if (target.id === currentAdmin?.id && input.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot remove your own admin role.",
      });
    }

    if (
      target.id === currentAdmin?.id &&
      input.computingId !== currentAdmin.computingId
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot change your own computing ID while signed in.",
      });
    }

    try {
      return await ctx.prisma.user.update({
        where: { id: target.id },
        data: {
          computingId: input.computingId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          nickname: input.nickname || null,
          studentNumber: input.studentNumber || null,
          role: input.role,
          pointsAcquired: input.pointsAcquired,
          problemsSolved: input.problemsSolved,
          competitionsParticipated: input.competitionsParticipated,
          rank: input.rank || null,
        },
        select: { id: true },
      });
    } catch {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The email or computing ID may already be used by another account.",
      });
    }
  }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [currentAdmin, target] = await Promise.all([
        ctx.prisma.user.findUnique({
          where: { computingId: ctx.user.computingId },
          select: { id: true },
        }),
        ctx.prisma.user.findUnique({
          where: { id: input.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        }),
      ]);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (target.id === currentAdmin?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete your own admin account.",
        });
      }

      await ctx.prisma.user.delete({ where: { id: target.id } });

      return {
        id: target.id,
        name: `${target.firstName} ${target.lastName}`.trim(),
      };
    }),
});
