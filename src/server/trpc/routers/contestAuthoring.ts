import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { can } from "@/lib/authz";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";

const visibilitySchema = z.enum(["course-only", "public", "private"]);
const hintDelayMinutesSchema = z.number().int().min(0).max(10_080);
const DEFAULT_GROUP_A_HINT_DELAY_MINUTES = 5;
const DEFAULT_GROUP_B_HINT_DELAY_MINUTES = 10;

const contestMutationSchema = z.object({
  contestName: z.string().trim().min(1, "Contest name is required."),
  description: z.string(),
  startDate: z.string(),
  startTime: z.string(),
  startUtcOffsetMinutes: z.number().int().optional(),
  endDate: z.string(),
  endTime: z.string(),
  endUtcOffsetMinutes: z.number().int().nullable().optional(),
  visibility: visibilitySchema,
  aiHintEnabled: z.boolean(),
  groupAHintAfterMinutes: hintDelayMinutesSchema.default(DEFAULT_GROUP_A_HINT_DELAY_MINUTES),
  groupBHintAfterMinutes: hintDelayMinutesSchema.default(DEFAULT_GROUP_B_HINT_DELAY_MINUTES),
  isDraft: z.boolean().default(false),
  selectedProblemIds: z.array(z.string().min(1)).default([]),
});

const contestPatchSchema = z
  .object({
    contestName: z.string().trim().min(1, "Contest name is required.").optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    startUtcOffsetMinutes: z.number().int().optional(),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
    endUtcOffsetMinutes: z.number().int().nullable().optional(),
    visibility: visibilitySchema.optional(),
    aiHintEnabled: z.boolean().optional(),
    groupAHintAfterMinutes: hintDelayMinutesSchema.optional(),
    groupBHintAfterMinutes: hintDelayMinutesSchema.optional(),
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

function parseDateTimeWithOffset(
  dateValue: string,
  timeValue: string,
  label: string,
  utcOffsetMinutes?: number | null,
) {
  if (utcOffsetMinutes === undefined || utcOffsetMinutes === null) {
    return parseDateTime(dateValue, timeValue, label);
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid ${label}.`,
    });
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ) +
      utcOffsetMinutes * 60_000,
  );

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

function hasImplicitDraftSchedule(contest: {
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";
  startsAt: Date;
  endsAt: Date | null;
  updatedAt: Date;
}) {
  if (contest.status !== "DRAFT" || contest.endsAt) {
    return false;
  }

  return Math.abs(contest.startsAt.getTime() - contest.updatedAt.getTime()) < 60_000;
}

function hasOwnKey<T extends object>(
  value: T,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

async function replaceContestExperimentGroups(
  tx: Prisma.TransactionClient,
  contestId: string,
  input: {
    aiHintEnabled: boolean;
    groupAHintAfterMinutes: number;
    groupBHintAfterMinutes: number;
  },
) {
  await tx.contestExperimentGroup.deleteMany({
    where: { contestId },
  });

  if (!input.aiHintEnabled) {
    return;
  }

  await tx.contestExperimentGroup.createMany({
    data: [
      {
        contestId,
        groupName: "A",
        aiHintEnabled: true,
        hintDelayMinutes: input.groupAHintAfterMinutes,
      },
      {
        contestId,
        groupName: "B",
        aiHintEnabled: true,
        hintDelayMinutes: input.groupBHintAfterMinutes,
      },
    ],
  });
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
        manageStatus: "ACTIVE",
        isDraft: false,
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
          experimentGroups: true,
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

      const groupAHintAfterMinutes =
        contest.experimentGroups.find((group) => group.groupName === "A")?.hintDelayMinutes ??
        DEFAULT_GROUP_A_HINT_DELAY_MINUTES;
      const groupBHintAfterMinutes =
        contest.experimentGroups.find((group) => group.groupName === "B")?.hintDelayMinutes ??
        DEFAULT_GROUP_B_HINT_DELAY_MINUTES;

      return {
        id: contest.id,
        contestName: contest.name,
        description: contest.description ?? "",
        startsAtIso: hasImplicitDraftSchedule(contest) ? null : contest.startsAt.toISOString(),
        endsAtIso: contest.endsAt?.toISOString() ?? null,
        visibility: toUiVisibility(contest.visibility),
        aiHintEnabled: contest.aiHintEnabled,
        groupAHintAfterMinutes,
        groupBHintAfterMinutes,
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
        ? parseDateTimeWithOffset(
            input.startDate,
            input.startTime,
            "start date/time",
            input.startUtcOffsetMinutes,
          )
        : new Date();
      const hasEnd = input.endDate.trim() || input.endTime.trim();
      const endsAt = hasEnd
        ? parseDateTimeWithOffset(
            input.endDate.trim(),
            input.endTime.trim(),
            "end date/time",
            input.endUtcOffsetMinutes,
          )
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
            manageStatus: "ACTIVE",
            isDraft: false,
          },
          select: { id: true },
        });

        if (problems.length !== input.selectedProblemIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only active, non-draft problems can be used in this contest.",
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
            published: !input.isDraft,
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

        await replaceContestExperimentGroups(tx, created.id, {
          aiHintEnabled: input.aiHintEnabled,
          groupAHintAfterMinutes: input.groupAHintAfterMinutes,
          groupBHintAfterMinutes: input.groupBHintAfterMinutes,
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
          status: true,
          manageStatus: true,
          startsAt: true,
          endsAt: true,
          updatedAt: true,
          aiHintEnabled: true,
          experimentGroups: true,
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

      const remainsDraft = input.data.isDraft ?? contest.status === "DRAFT";
      const hasStartDate = hasOwnKey(input.data, "startDate");
      const hasStartTime = hasOwnKey(input.data, "startTime");
      const hasEndDate = hasOwnKey(input.data, "endDate");
      const hasEndTime = hasOwnKey(input.data, "endTime");
      const startScheduleChanged = hasStartDate || hasStartTime;
      const endScheduleChanged = hasEndDate || hasEndTime;
      const scheduleChanged = startScheduleChanged || endScheduleChanged;
      const aiHintSettingsChanged =
        hasOwnKey(input.data, "aiHintEnabled") ||
        hasOwnKey(input.data, "groupAHintAfterMinutes") ||
        hasOwnKey(input.data, "groupBHintAfterMinutes");

      const startDateValue = hasStartDate
        ? (input.data.startDate ?? "").trim()
        : "";
      const startTimeValue = hasStartTime
        ? (input.data.startTime ?? "").trim()
        : "";

      const clearsStartSchedule = !startDateValue && !startTimeValue;

      if (
        startScheduleChanged &&
        !clearsStartSchedule &&
        (!startDateValue || !startTimeValue)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date and start time are required.",
        });
      }

      if (startScheduleChanged && clearsStartSchedule && !remainsDraft) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date and start time are required.",
        });
      }

      const startsAt = startScheduleChanged
        ? clearsStartSchedule
          ? new Date()
          : parseDateTimeWithOffset(
              startDateValue,
              startTimeValue,
              "start date/time",
              input.data.startUtcOffsetMinutes,
            )
        : contest.startsAt;

      const endDateValue = hasEndDate
        ? (input.data.endDate ?? "").trim()
        : "";
      const endTimeValue = hasEndTime
        ? (input.data.endTime ?? "").trim()
        : "";
      const hasEnd = Boolean(endDateValue || endTimeValue);

      if (endScheduleChanged && hasEnd && (!endDateValue || !endTimeValue)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both end date and end time are required when updating the end schedule.",
        });
      }

      const endsAt = endScheduleChanged
        ? hasEnd
          ? parseDateTimeWithOffset(
              endDateValue,
              endTimeValue,
              "end date/time",
              input.data.endUtcOffsetMinutes,
            )
          : null
        : contest.endsAt;

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
            manageStatus: "ACTIVE",
            isDraft: false,
          },
          select: { id: true },
        });

        if (problems.length !== (input.data.selectedProblemIds ?? []).length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only active, non-draft problems can be used in this contest.",
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

        if (aiHintSettingsChanged) {
          const existingGroupAHintAfterMinutes =
            contest.experimentGroups.find((group) => group.groupName === "A")?.hintDelayMinutes ??
            DEFAULT_GROUP_A_HINT_DELAY_MINUTES;
          const existingGroupBHintAfterMinutes =
            contest.experimentGroups.find((group) => group.groupName === "B")?.hintDelayMinutes ??
            DEFAULT_GROUP_B_HINT_DELAY_MINUTES;

          await replaceContestExperimentGroups(tx, input.contestId, {
            aiHintEnabled: input.data.aiHintEnabled ?? contest.aiHintEnabled,
            groupAHintAfterMinutes:
              input.data.groupAHintAfterMinutes ?? existingGroupAHintAfterMinutes,
            groupBHintAfterMinutes:
              input.data.groupBHintAfterMinutes ?? existingGroupBHintAfterMinutes,
          });
        }
      });

      return { id: input.contestId };
    }),
});
