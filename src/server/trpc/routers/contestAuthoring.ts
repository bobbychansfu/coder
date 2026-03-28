import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { can } from "@/lib/authz";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";

const visibilitySchema = z.enum(["course-only", "public", "private"]);

const contestMutationSchema = z.object({
  contestName: z.string().trim().min(1, "Contest name is required."),
  description: z.string(),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
  visibility: visibilitySchema,
  aiHintEnabled: z.boolean(),
  isDraft: z.boolean().default(false),
  selectedProblemIds: z.array(z.string().min(1)).default([]),
});

const contestPatchSchema = z
  .object({
    contestName: z.string().trim().min(1, "Contest name is required.").optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
    visibility: visibilitySchema.optional(),
    aiHintEnabled: z.boolean().optional(),
    isDraft: z.boolean().optional(),
    selectedProblemIds: z.array(z.string().min(1)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
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

function hasOwnKey<T extends object>(
  value: T,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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
  listDraftContests: publicProcedure.query(async ({ ctx }) => {
    const dbUser = await getContestAuthoringUserOrThrow(ctx);
    const isAdmin = ctx.user?.role === "admin";

    const contests = await ctx.prisma.contest.findMany({
      where: {
        ...(isAdmin ? {} : { instructorId: dbUser.id }),
        status: "DRAFT",
        manageStatus: "ACTIVE",
      },
      include: {
        _count: {
          select: {
            contestProblems: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return contests.map((contest) => ({
      id: contest.id,
      title: contest.name,
      updatedAt: contest.updatedAt.toISOString(),
      status: "Draft" as const,
      problemsCount: contest._count.contestProblems,
      durationMinutes: contest.durationMinutes,
    }));
  }),

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
      source: problem.source === "CONTEST" ? "contest-only" : "public",
      isDraft: problem.isDraft,
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
        status: contest.status,
        selectedProblemIds: contest.contestProblems.map((entry) => entry.problemId),
        selectedProblems: contest.contestProblems.map((entry) => ({
          id: entry.problem.id,
          title: entry.problem.title,
          difficulty: entry.problem.difficulty.toLowerCase() as "easy" | "medium" | "hard",
          points: entry.problem.points ?? 0,
          tags: entry.problem.topics.map((topic) => topic.name),
          source: entry.problem.source === "CONTEST" ? "contest-only" : "public",
          manageStatus: entry.problem.manageStatus.toLowerCase(),
        })),
      };
    }),

  createContest: publicProcedure
    .input(contestMutationSchema)
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getContestAuthoringUserOrThrow(ctx);

      if (!input.isDraft && input.selectedProblemIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select at least one problem.",
        });
      }

      const hasStartSchedule = input.startDate.trim() && input.startTime.trim();
      if (!input.isDraft && !hasStartSchedule) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date and start time are required.",
        });
      }

      const startsAt = hasStartSchedule
        ? parseDateTime(input.startDate, input.startTime, "start date/time")
        : new Date();
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

      if (input.selectedProblemIds.length > 0) {
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
            status: input.isDraft ? "DRAFT" : computeContestStatus(startsAt, endsAt),
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
        data: contestPatchSchema,
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
          startsAt: true,
          endsAt: true,
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

      const hasStartDate = hasOwnKey(input.data, "startDate");
      const hasStartTime = hasOwnKey(input.data, "startTime");
      const hasEndDate = hasOwnKey(input.data, "endDate");
      const hasEndTime = hasOwnKey(input.data, "endTime");
      const scheduleChanged = hasStartDate || hasStartTime || hasEndDate || hasEndTime;

      const startDateValue = hasStartDate
        ? (input.data.startDate ?? "").trim()
        : formatDateInput(contest.startsAt);
      const startTimeValue = hasStartTime
        ? (input.data.startTime ?? "").trim()
        : formatTimeInput(contest.startsAt);

      if (!startDateValue || !startTimeValue) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date and start time are required.",
        });
      }

      const startsAt = parseDateTime(startDateValue, startTimeValue, "start date/time");

      const existingEndDateValue = contest.endsAt ? formatDateInput(contest.endsAt) : "";
      const existingEndTimeValue = contest.endsAt ? formatTimeInput(contest.endsAt) : "";
      const endDateValue = hasEndDate
        ? (input.data.endDate ?? "").trim()
        : existingEndDateValue;
      const endTimeValue = hasEndTime
        ? (input.data.endTime ?? "").trim()
        : existingEndTimeValue;
      const hasEnd = Boolean(endDateValue || endTimeValue);

      if (hasEnd && (!endDateValue || !endTimeValue)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both end date and end time are required when updating the end schedule.",
        });
      }

      const endsAt = hasEnd
        ? parseDateTime(endDateValue, endTimeValue, "end date/time")
        : null;

      if (scheduleChanged && endsAt && endsAt <= startsAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End time must be after start time.",
        });
      }

      if (hasOwnKey(input.data, "selectedProblemIds")) {
        const problems = await ctx.prisma.problem.findMany({
          where: {
            id: { in: input.data.selectedProblemIds },
            manageStatus: {
              not: "DELETED",
            },
          },
          select: { id: true },
        });

        if (problems.length !== (input.data.selectedProblemIds ?? []).length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more selected problems cannot be used in this contest.",
          });
        }
      }

      await ctx.prisma.$transaction(async (tx) => {
        const contestUpdateData: Prisma.ContestUpdateInput = {};

        if (hasOwnKey(input.data, "contestName")) {
          contestUpdateData.name = input.data.contestName?.trim();
        }

        if (hasOwnKey(input.data, "description")) {
          contestUpdateData.description = input.data.description?.trim() || null;
        }

        if (hasOwnKey(input.data, "visibility") && input.data.visibility) {
          contestUpdateData.visibility = toDbVisibility(input.data.visibility);
        }

        if (hasOwnKey(input.data, "aiHintEnabled") && input.data.aiHintEnabled !== undefined) {
          contestUpdateData.aiHintEnabled = input.data.aiHintEnabled;
        }

        if (hasOwnKey(input.data, "isDraft") && input.data.isDraft !== undefined) {
          if (input.data.isDraft) {
            contestUpdateData.status = "DRAFT";
          } else if (!scheduleChanged) {
            contestUpdateData.status = computeContestStatus(startsAt, endsAt);
          }
        }

        if (scheduleChanged) {
          const durationMinutes = endsAt
            ? Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000))
            : null;

          contestUpdateData.startsAt = startsAt;
          contestUpdateData.endsAt = endsAt;
          contestUpdateData.durationMinutes = durationMinutes;
          if (!input.data.isDraft) {
            contestUpdateData.status = computeContestStatus(startsAt, endsAt);
          }
        }

        if (Object.keys(contestUpdateData).length > 0) {
          await tx.contest.update({
            where: { id: input.contestId },
            data: contestUpdateData,
          });
        }

        if (hasOwnKey(input.data, "selectedProblemIds")) {
          await tx.contestProblem.deleteMany({
            where: { contestId: input.contestId },
          });

          await tx.contestProblem.createMany({
            data: (input.data.selectedProblemIds ?? []).map((problemId, index) => ({
              contestId: input.contestId,
              problemId,
              ordering: index + 1,
            })),
          });
        }
      });

      return { id: input.contestId };
    }),
});
