import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { ManageLifecycleStatus } from "@prisma/client";
import { can } from "@/lib/authz";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";


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

function getProblemDisplayStatus(isDraft: boolean, manageStatus: string): ManagedProblemDisplayStatus {
  if (manageStatus === "ARCHIVED") return "archived";
  if (manageStatus === "DELETED") return "deleted";
  if (isDraft) return "draft";
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
  getInstructorOverview: publicProcedure.query(async ({ ctx }) => {
    const dbUser = await getDbUserOrThrow(ctx);
    const isAdmin = ctx.user?.role === "admin";
    const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();

    const [contests, problems] = await Promise.all([
      ctx.prisma.contest.findMany({
        where: isAdmin ? undefined : { instructorId: dbUser.id },
        select: {
          id: true,
          name: true,
          status: true,
          manageStatus: true,
          updatedAt: true,
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
                { contestLinks: { some: { contest: { instructorId: dbUser.id } } } },
              ],
            },
        select: {
          id: true,
          title: true,
          isDraft: true,
          manageStatus: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const activeContestsCount = contests.filter(
      (c) =>
        c.manageStatus !== "ARCHIVED" &&
        c.manageStatus !== "DELETED" &&
        (c.status === "ACTIVE" || c.status === "UPCOMING"),
    ).length;

    const problemsCreatedCount = problems.filter(
      (p) => p.manageStatus !== "ARCHIVED" && p.manageStatus !== "DELETED",
    ).length;

    const contestActivity = contests.slice(0, 5).map((c) => ({
      id: `contest-${c.id}`,
      type: "contest" as const,
      title: c.name,
      status: getContestDisplayStatus(c.status, c.manageStatus),
      updatedAt: c.updatedAt.toISOString(),
    }));

    const problemActivity = problems.slice(0, 5).map((p) => ({
      id: `problem-${p.id}`,
      type: "problem" as const,
      title: p.title,
      status: getProblemDisplayStatus(p.isDraft, p.manageStatus),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const recentActivity = [...contestActivity, ...problemActivity]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);

    return { activeContestsCount, problemsCreatedCount, recentActivity };
  }),

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

    // Participation counts for all contests
    const contestIds = contests.map((c) => c.id);
    const enrolledMap: Record<string, number> = {};
    const submittedMap: Record<string, number> = {};

    if (contestIds.length > 0) {
      const [enrolledGroups, submittedRows] = await Promise.all([
        ctx.prisma.participation.groupBy({
          by: ["contestId"],
          where: { contestId: { in: contestIds } },
          _count: { userId: true },
        }),
        ctx.prisma.submission.findMany({
          where: { contestId: { in: contestIds } },
          select: { contestId: true, userId: true },
          distinct: ["contestId", "userId"],
        }),
      ]);

      for (const row of enrolledGroups) {
        enrolledMap[row.contestId] = row._count.userId;
      }
      for (const row of submittedRows) {
        submittedMap[row.contestId] = (submittedMap[row.contestId] ?? 0) + 1;
      }
    }

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
          enrolledCount: enrolledMap[contest.id] ?? 0,
          submittedCount: submittedMap[contest.id] ?? 0,
        };
      }),
      problems: problems.map((problem) => ({
        id: problem.id,
        title: problem.title,
        points: problem.points ?? 0,
        status: getProblemDisplayStatus(problem.isDraft, problem.manageStatus),
        difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        tags: problem.topics.length > 0 ? problem.topics.map((topic) => topic.name) : ["untagged"],
      })),
    };
  }),

  updateContestManageStatus: publicProcedure
    .input(
      z.object({
        contestId: z.string().min(1),
        manageStatus: z.union([z.literal("ARCHIVED"), z.literal("DELETED")]),
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
        manageStatus: z.union([z.literal("ARCHIVED"), z.literal("DELETED")]),
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
