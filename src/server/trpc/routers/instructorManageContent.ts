import { TRPCError } from "@trpc/server";
import { ManageLifecycleStatus } from "@prisma/client";
import { z } from "zod";
import { can } from "@/lib/authz";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";

type ManagedContestDisplayStatus =
  | "active"
  | "upcoming"
  | "draft"
  | "ended"
  | "archived"
  | "deleted";

type ManagedProblemDisplayStatus = "active" | "archived" | "deleted";

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getContestDisplayStatus(
  workflowStatus: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED",
  manageStatus: ManageLifecycleStatus,
): ManagedContestDisplayStatus {
  if (manageStatus === "ARCHIVED") {
    return "archived";
  }

  if (manageStatus === "DELETED") {
    return "deleted";
  }

  return workflowStatus.toLowerCase() as ManagedContestDisplayStatus;
}

function getProblemDisplayStatus(manageStatus: ManageLifecycleStatus): ManagedProblemDisplayStatus {
  if (manageStatus === "ARCHIVED") {
    return "archived";
  }

  if (manageStatus === "DELETED") {
    return "deleted";
  }

  return "active";
}

async function getDbUserOrThrow(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!can(ctx.user.role).canManageContest) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const dbUser = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return dbUser;
}

export const instructorManageContentRouter = router({
  getManageContent: publicProcedure.query(async ({ ctx }) => {
    const dbUser = await getDbUserOrThrow(ctx);
    const isAdmin = ctx.user?.role === "admin";
    const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();

    const [contests, problems] = await Promise.all([
      ctx.prisma.contest.findMany({
        where: isAdmin ? undefined : { instructorId: dbUser.id },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
              computingId: true,
            },
          },
          _count: {
            select: {
              contestProblems: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      ctx.prisma.problem.findMany({
        where: isAdmin
          ? undefined
          : {
              OR: [
                { author: { equals: ctx.user?.computingId, mode: "insensitive" } },
                { author: { equals: fullName, mode: "insensitive" } },
                {
                  contestLinks: {
                    some: {
                      contest: {
                        instructorId: dbUser.id,
                      },
                    },
                  },
                },
              ],
            },
        include: {
          topics: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return {
      contests: contests.map((contest) => {
        const computedEndAt =
          contest.endsAt ??
          (contest.durationMinutes
            ? new Date(contest.startsAt.getTime() + contest.durationMinutes * 60 * 1000)
            : null);

        const ownerName = contest.instructor
          ? `${contest.instructor.firstName} ${contest.instructor.lastName}`.trim()
          : "Unassigned";

        return {
          id: contest.id,
          title: contest.name,
          owner: ownerName || contest.instructor?.computingId || "Unassigned",
          section: contest.classSection ?? "No section",
          status: getContestDisplayStatus(contest.status, contest.manageStatus),
          startAt: formatDateTime(contest.startsAt),
          endAt: formatDateTime(computedEndAt),
          problemsCount: contest._count.contestProblems,
        };
      }),
      problems: problems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        points: problem.points ?? 0,
        status: getProblemDisplayStatus(problem.manageStatus),
        difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        tags: problem.topics.length > 0 ? problem.topics.map((topic) => topic.name) : ["untagged"],
      })),
    };
  }),

  updateContestManageStatus: publicProcedure
    .input(
      z.object({
        contestId: z.string().min(1),
        manageStatus: z.nativeEnum(ManageLifecycleStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUserOrThrow(ctx);
      const isAdmin = ctx.user?.role === "admin";

      const contest = await ctx.prisma.contest.findUnique({
        where: { id: input.contestId },
        select: { id: true, instructorId: true },
      });

      if (!contest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contest not found." });
      }

      if (!isAdmin && contest.instructorId !== dbUser.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.contest.update({
        where: { id: input.contestId },
        data: { manageStatus: input.manageStatus },
        select: { id: true, manageStatus: true },
      });
    }),

  updateProblemManageStatus: publicProcedure
    .input(
      z.object({
        problemId: z.string().min(1),
        manageStatus: z.nativeEnum(ManageLifecycleStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getDbUserOrThrow(ctx);
      const isAdmin = ctx.user?.role === "admin";
      const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();

      const problem = await ctx.prisma.problem.findUnique({
        where: { id: input.problemId },
        select: {
          id: true,
          author: true,
          contestLinks: {
            select: {
              contest: {
                select: {
                  instructorId: true,
                },
              },
            },
          },
        },
      });

      if (!problem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      const ownsProblem =
        problem.author?.toLowerCase() === ctx.user?.computingId.toLowerCase() ||
        problem.author?.toLowerCase() === fullName.toLowerCase() ||
        problem.contestLinks.some((link) => link.contest.instructorId === dbUser.id);

      if (!isAdmin && !ownsProblem) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.problem.update({
        where: { id: input.problemId },
        data: { manageStatus: input.manageStatus },
        select: { id: true, manageStatus: true },
      });
    }),
});
