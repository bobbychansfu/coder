import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { can } from "@/lib/authz";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";

const visibilitySchema = z.enum(["course-only", "public", "private"]);

const contestMutationSchema = z.object({
  contestName: z.string().trim().min(1, "Contest name is required."),
  description: z.string(),
  startDate: z.string().trim().min(1, "Start date is required."),
  startTime: z.string().trim().min(1, "Start time is required."),
  endDate: z.string(),
  endTime: z.string(),
  visibility: visibilitySchema,
  aiHintEnabled: z.boolean(),
  selectedProblemIds: z.array(z.string().min(1)).min(1, "Select at least one problem."),
});

function slugifyValue(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled-contest";
}

function toUiVisibility(value: "PUBLIC" | "PRIVATE" | "COURSE_ONLY") {
  if (value === "COURSE_ONLY") {
    return "course-only";
  }

  return value.toLowerCase() as z.infer<typeof visibilitySchema>;
}

function toDbVisibility(value: z.infer<typeof visibilitySchema>) {
  switch (value) {
    case "public":
      return "PUBLIC" as const;
    case "private":
      return "PRIVATE" as const;
    case "course-only":
    default:
      return "COURSE_ONLY" as const;
  }
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatTimeInput(value: Date) {
  return value.toISOString().slice(11, 16);
}

function parseDateTime(dateValue: string, timeValue: string, label: string) {
  const parsed = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(parsed.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid ${label}.`,
    });
  }

  return parsed;
}

function computeContestStatus(startsAt: Date, endsAt: Date | null) {
  const now = new Date();

  if (startsAt > now) {
    return "UPCOMING" as const;
  }

  if (endsAt && endsAt <= now) {
    return "ENDED" as const;
  }

  return "ACTIVE" as const;
}

async function getContestAuthoringUserOrThrow(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!can(ctx.user.role).canManageContest) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const dbUser = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: {
      id: true,
      computingId: true,
    },
  });

  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return dbUser;
}

async function ensureUniqueContestSlug(
  ctx: Context,
  contestName: string,
  excludeContestId?: string,
) {
  const baseSlug = slugifyValue(contestName);
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await ctx.prisma.contest.findFirst({
      where: {
        slug: candidate,
        ...(excludeContestId ? { id: { not: excludeContestId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
  }
}

export const contestAuthoringRouter = router({
  listProblemLibrary: publicProcedure.query(async ({ ctx }) => {
    await getContestAuthoringUserOrThrow(ctx);

    const problems = await ctx.prisma.problem.findMany({
      where: {
        manageStatus: {
          not: "DELETED",
        },
      },
      include: {
        topics: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { title: "asc" },
    });

    return problems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
      points: problem.points ?? 0,
      tags: problem.topics.map((topic) => topic.name),
      manageStatus: problem.manageStatus.toLowerCase(),
    }));
  }),

  getContestById: publicProcedure
    .input(z.object({ contestId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const dbUser = await getContestAuthoringUserOrThrow(ctx);
      const isAdmin = ctx.user?.role === "admin";

      const contest = await ctx.prisma.contest.findUnique({
        where: { id: input.contestId },
        include: {
          contestProblems: {
            orderBy: { ordering: "asc" },
            include: {
              problem: {
                include: {
                  topics: {
                    orderBy: { name: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (!contest || contest.manageStatus === "DELETED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contest not found." });
      }

      if (!isAdmin && contest.instructorId !== dbUser.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return {
        id: contest.id,
        contestName: contest.name,
        description: contest.description ?? "",
        startDate: formatDateInput(contest.startsAt),
        startTime: formatTimeInput(contest.startsAt),
        endDate: contest.endsAt ? formatDateInput(contest.endsAt) : "",
        endTime: contest.endsAt ? formatTimeInput(contest.endsAt) : "",
        visibility: toUiVisibility(contest.visibility),
        aiHintEnabled: contest.aiHintEnabled,
        selectedProblemIds: contest.contestProblems.map((entry) => entry.problemId),
        selectedProblems: contest.contestProblems.map((entry) => ({
          id: entry.problem.id,
          title: entry.problem.title,
          difficulty: entry.problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
          points: entry.problem.points ?? 0,
          tags: entry.problem.topics.map((topic) => topic.name),
          manageStatus: entry.problem.manageStatus.toLowerCase(),
        })),
      };
    }),

  createContest: publicProcedure
    .input(contestMutationSchema)
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getContestAuthoringUserOrThrow(ctx);
      const startsAt = parseDateTime(input.startDate, input.startTime, "start date/time");
      const hasEnd = input.endDate.trim() || input.endTime.trim();
      const endsAt = hasEnd
        ? parseDateTime(input.endDate.trim(), input.endTime.trim(), "end date/time")
        : null;

      if (endsAt && endsAt <= startsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time.",
        });
      }

      const problems = await ctx.prisma.problem.findMany({
        where: {
          id: { in: input.selectedProblemIds },
          manageStatus: {
            not: "DELETED",
          },
        },
        select: { id: true },
      });

      if (problems.length !== input.selectedProblemIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more selected problems cannot be used in this contest.",
        });
      }

      const slug = await ensureUniqueContestSlug(ctx, input.contestName);
      const durationMinutes = endsAt
        ? Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))
        : null;

      const contest = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.contest.create({
          data: {
            slug,
            name: input.contestName.trim(),
            description: input.description.trim() || null,
            visibility: toDbVisibility(input.visibility),
            startsAt,
            endsAt,
            durationMinutes,
            aiHintEnabled: input.aiHintEnabled,
            published: true,
            status: computeContestStatus(startsAt, endsAt),
            instructorId: dbUser.id,
          },
          select: { id: true },
        });

        await tx.contestProblem.createMany({
          data: input.selectedProblemIds.map((problemId, index) => ({
            contestId: created.id,
            problemId,
            ordering: index + 1,
          })),
        });

        return created;
      });

      return contest;
    }),

  updateContest: publicProcedure
    .input(
      z.object({
        contestId: z.string().min(1),
        data: contestMutationSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getContestAuthoringUserOrThrow(ctx);
      const isAdmin = ctx.user?.role === "admin";

      const contest = await ctx.prisma.contest.findUnique({
        where: { id: input.contestId },
        select: {
          id: true,
          instructorId: true,
          manageStatus: true,
        },
      });

      if (!contest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contest not found." });
      }

      if (contest.manageStatus === "DELETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deleted contests cannot be edited.",
        });
      }

      if (!isAdmin && contest.instructorId !== dbUser.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const startsAt = parseDateTime(input.data.startDate, input.data.startTime, "start date/time");
      const hasEnd = input.data.endDate.trim() || input.data.endTime.trim();
      const endsAt = hasEnd
        ? parseDateTime(
            input.data.endDate.trim(),
            input.data.endTime.trim(),
            "end date/time",
          )
        : null;

      if (endsAt && endsAt <= startsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time.",
        });
      }

      const problems = await ctx.prisma.problem.findMany({
        where: {
          id: { in: input.data.selectedProblemIds },
          manageStatus: {
            not: "DELETED",
          },
        },
        select: { id: true },
      });

      if (problems.length !== input.data.selectedProblemIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more selected problems cannot be used in this contest.",
        });
      }

      const durationMinutes = endsAt
        ? Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))
        : null;

      await ctx.prisma.$transaction(async (tx) => {
        await tx.contest.update({
          where: { id: input.contestId },
          data: {
            name: input.data.contestName.trim(),
            description: input.data.description.trim() || null,
            visibility: toDbVisibility(input.data.visibility),
            startsAt,
            endsAt,
            durationMinutes,
            aiHintEnabled: input.data.aiHintEnabled,
            published: true,
            status: computeContestStatus(startsAt, endsAt),
          },
        });

        await tx.contestProblem.deleteMany({
          where: { contestId: input.contestId },
        });

        await tx.contestProblem.createMany({
          data: input.data.selectedProblemIds.map((problemId, index) => ({
            contestId: input.contestId,
            problemId,
            ordering: index + 1,
          })),
        });
      });

      return { id: input.contestId };
    }),
});
