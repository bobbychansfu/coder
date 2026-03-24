import { TRPCError } from "@trpc/server";
import type { CodingLanguage, ManageLifecycleStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { can } from "@/lib/authz";
import {
  APP_LANGUAGES,
  appLanguageToCodingLanguage,
  codingLanguageToAppLanguage,
} from "@/server/coding-language";
import type { Context } from "../init";
import { publicProcedure, router } from "../init";

const starterLanguageSchema = z.enum(APP_LANGUAGES);
const visibilitySchema = z.enum(["course-only", "public", "private"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

const generatedStarterCodesSchema = z
  .object({
    cplusplus: z.string().min(1).optional(),
    java: z.string().min(1).optional(),
    python: z.string().min(1).optional(),
    typescript: z.string().min(1).optional(),
    javascript: z.string().min(1).optional(),
  })
  .partial();

const starterCodesInputSchema = z.object({
  cplusplus: z.string(),
  java: z.string(),
  python: z.string(),
  typescript: z.string(),
  javascript: z.string(),
});

const problemExampleSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  explanation: z.string(),
});

const problemMutationSchema = z.object({
  title: z.string().trim().min(1, "Problem title is required."),
  difficulty: difficultySchema,
  points: z.number().int().nonnegative(),
  tags: z.array(z.string()).default([]),
  visibility: visibilitySchema,
  statement: z.string().trim().min(1, "Problem statement is required."),
  inputFormat: z.string().trim().min(1, "Input format is required."),
  outputFormat: z.string().trim().min(1, "Output format is required."),
  constraints: z.string().trim().min(1, "Constraints are required."),
  examples: z
    .array(problemExampleSchema)
    .max(1, "Only one example is currently supported.")
    .default([]),
  starterCodes: starterCodesInputSchema,
});

const problemPatchSchema = z
  .object({
    title: z.string().trim().min(1, "Problem title is required.").optional(),
    difficulty: difficultySchema.optional(),
    points: z.number().int().nonnegative().optional(),
    tags: z.array(z.string()).optional(),
    visibility: visibilitySchema.optional(),
    statement: z.string().trim().min(1, "Problem statement is required.").optional(),
    inputFormat: z.string().trim().min(1, "Input format is required.").optional(),
    outputFormat: z.string().trim().min(1, "Output format is required.").optional(),
    constraints: z.string().trim().min(1, "Constraints are required.").optional(),
    examples: z
      .array(problemExampleSchema)
      .max(1, "Only one example is currently supported.")
      .optional(),
    starterCodes: starterCodesInputSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Gemini did not return a JSON object.",
    });
  }

  return text.slice(start, end + 1);
}

function buildGenerationPrompt(input: {
  title?: string;
  statement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  baseLanguage: z.infer<typeof starterLanguageSchema>;
  baseCode: string;
  targetLanguages: readonly z.infer<typeof starterLanguageSchema>[];
}) {
  const problemContext = [
    input.title?.trim() ? `Problem title: ${input.title.trim()}` : null,
    input.statement?.trim() ? `Problem statement:\n${input.statement.trim()}` : null,
    input.inputFormat?.trim() ? `Input format:\n${input.inputFormat.trim()}` : null,
    input.outputFormat?.trim() ? `Output format:\n${input.outputFormat.trim()}` : null,
    input.constraints?.trim() ? `Constraints:\n${input.constraints.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const responseShape = Object.fromEntries(
    input.targetLanguages.map((language) => [language, "<generated starter code>"]),
  );

  return [
    "You are generating starter code templates for a competitive programming problem.",
    "Convert the provided base starter code into equivalent starter code for the target languages.",
    "Return starter code only, not full solutions.",
    "Preserve the intent, function signatures, placeholder comments, and starter-template structure.",
    "Do not add explanations, markdown fences, or prose.",
    "Return ONLY a valid JSON object whose keys are exactly the requested target languages.",
    `Target languages: ${input.targetLanguages.join(", ")}`,
    `Base language: ${input.baseLanguage}`,
    problemContext ? `\n${problemContext}` : "",
    `\nBase starter code:\n${input.baseCode}`,
    `\nReturn JSON in this shape:\n${JSON.stringify(responseShape, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function getAuthoringUserOrThrow(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!can(ctx.user.role).canCreateProblem) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const dbUser = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: {
      id: true,
      computingId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return dbUser;
}

function slugifyValue(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled-problem";
}

async function ensureUniqueProblemCode(
  ctx: Context,
  title: string,
  excludeProblemId?: string,
) {
  const baseCode = slugifyValue(title);
  let attempt = 0;

  while (true) {
    const candidate = attempt === 0 ? baseCode : `${baseCode}-${attempt + 1}`;
    const existing = await ctx.prisma.problem.findFirst({
      where: {
        code: candidate,
        ...(excludeProblemId ? { id: { not: excludeProblemId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
  }
}

function normalizeDifficulty(value: z.infer<typeof difficultySchema>) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function getPrimaryExample(examples: Array<z.infer<typeof problemExampleSchema>>) {
  return (
    examples.find((example) => example.input.trim() && example.output.trim()) ?? {
      id: "example-1",
      input: "",
      output: "",
      explanation: "",
    }
  );
}

function buildStarterCodeRows(
  starterCodes: z.infer<typeof starterCodesInputSchema>,
): Array<{ language: CodingLanguage; code: string }> {
  return Object.entries(starterCodes)
    .map(([language, code]) => ({
      language: appLanguageToCodingLanguage(language),
      code: code.trim(),
    }))
    .filter((entry): entry is { language: CodingLanguage; code: string } => Boolean(entry.language))
    .filter((entry) => entry.code.length > 0);
}

function mapProblemManageStatus(status: ManageLifecycleStatus) {
  return status.toLowerCase();
}

function hasOwnKey<T extends object>(
  value: T,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function canEditProblem(
  input: {
    author: string | null;
    contestLinks: Array<{ contest: { instructorId: string | null } }>;
  },
  currentComputingId: string,
  fullName: string,
  dbUserId: string,
  isAdmin: boolean,
) {
  if (isAdmin) {
    return true;
  }

  return (
    input.author?.toLowerCase() === currentComputingId.toLowerCase() ||
    input.author?.toLowerCase() === fullName.toLowerCase() ||
    input.contestLinks.some((link) => link.contest.instructorId === dbUserId)
  );
}

export const problemAuthoringRouter = router({
  generateStarterCodes: publicProcedure
    .input(
      z.object({
        title: z.string().optional(),
        statement: z.string().optional(),
        inputFormat: z.string().optional(),
        outputFormat: z.string().optional(),
        constraints: z.string().optional(),
        baseLanguage: starterLanguageSchema,
        baseCode: z.string().trim().min(1, "Add base starter code before generating."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (!can(ctx.user.role).canCreateProblem) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Missing GEMINI_API_KEY on the server.",
        });
      }

      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const targetLanguages = APP_LANGUAGES.filter((language) => language !== input.baseLanguage);
      const prompt = buildGenerationPrompt({
        ...input,
        targetLanguages,
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gemini request failed (${response.status}): ${errorText.slice(0, 300)}`,
        });
      }

      const body = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!text) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gemini returned an empty response.",
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonObject(text));
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gemini returned starter code in an unexpected format.",
        });
      }

      const generatedCodes = generatedStarterCodesSchema.parse(parsed);
      const filteredCodes = Object.fromEntries(
        Object.entries(generatedCodes).filter(([language]) => language !== input.baseLanguage),
      ) as Partial<Record<(typeof APP_LANGUAGES)[number], string>>;

      for (const language of targetLanguages) {
        if (!filteredCodes[language]?.trim()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gemini did not return starter code for ${language}.`,
          });
        }
      }

      return {
        generatedCodes: filteredCodes,
        model,
      };
    }),

  getProblemById: publicProcedure
    .input(z.object({ problemId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const dbUser = await getAuthoringUserOrThrow(ctx);
      const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
      const isAdmin = ctx.user?.role === "admin";

      const problem = await ctx.prisma.problem.findUnique({
        where: { id: input.problemId },
        include: {
          topics: { orderBy: { name: "asc" } },
          starterCodes: true,
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

      if (!problem || problem.manageStatus === "DELETED") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      if (
        !canEditProblem(problem, dbUser.computingId, fullName, dbUser.id, isAdmin)
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const starterCodes = Object.fromEntries(
        APP_LANGUAGES.map((language) => [language, ""]),
      ) as Record<(typeof APP_LANGUAGES)[number], string>;

      problem.starterCodes.forEach((starterCode) => {
        starterCodes[codingLanguageToAppLanguage(starterCode.language)] = starterCode.code;
      });

      return {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty.toLowerCase() as z.infer<typeof difficultySchema>,
        points: problem.points ?? 0,
        tags: problem.topics.map((topic) => topic.name),
        visibility: (problem.visible ?? "course-only") as z.infer<typeof visibilitySchema>,
        statement: problem.statement,
        inputFormat: problem.inputFormat ?? "",
        outputFormat: problem.outputFormat ?? "",
        constraints: problem.constraints ?? "",
        examples: [
          {
            id: "example-1",
            input: problem.exampleInput ?? "",
            output: problem.exampleOutput ?? "",
            explanation: problem.exampleExplanation ?? "",
          },
        ],
        starterCodes,
        manageStatus: mapProblemManageStatus(problem.manageStatus),
      };
    }),

  createProblem: publicProcedure
    .input(problemMutationSchema)
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getAuthoringUserOrThrow(ctx);
      const code = await ensureUniqueProblemCode(ctx, input.title);
      const tags = normalizeTags(input.tags);
      const starterCodeRows = buildStarterCodeRows(input.starterCodes);
      const primaryExample = getPrimaryExample(input.examples);

      const problem = await ctx.prisma.problem.create({
        data: {
          code,
          title: input.title.trim(),
          statement: input.statement.trim(),
          inputFormat: input.inputFormat.trim(),
          outputFormat: input.outputFormat.trim(),
          constraints: input.constraints.trim(),
          exampleInput: primaryExample.input.trim() || null,
          exampleOutput: primaryExample.output.trim() || null,
          exampleExplanation: primaryExample.explanation.trim() || null,
          difficulty: normalizeDifficulty(input.difficulty),
          visible: input.visibility,
          author: dbUser.computingId,
          points: input.points,
          source: "BOTH",
          starterCodes: starterCodeRows.length
            ? {
                create: starterCodeRows,
              }
            : undefined,
          topics: tags.length
            ? {
                create: tags.map((name) => ({ name })),
              }
            : undefined,
        },
        select: { id: true },
      });

      return problem;
    }),

  updateProblem: publicProcedure
    .input(
      z.object({
        problemId: z.string().min(1),
        data: problemPatchSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dbUser = await getAuthoringUserOrThrow(ctx);
      const fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
      const isAdmin = ctx.user?.role === "admin";

      const existingProblem = await ctx.prisma.problem.findUnique({
        where: { id: input.problemId },
        select: {
          id: true,
          manageStatus: true,
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

      if (!existingProblem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      if (existingProblem.manageStatus === "DELETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deleted problems cannot be edited.",
        });
      }

      if (
        !canEditProblem(existingProblem, dbUser.computingId, fullName, dbUser.id, isAdmin)
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.$transaction(async (tx) => {
        const problemUpdateData: Prisma.ProblemUpdateInput = {};

        if (hasOwnKey(input.data, "title")) {
          problemUpdateData.title = input.data.title?.trim();
        }

        if (hasOwnKey(input.data, "statement")) {
          problemUpdateData.statement = input.data.statement?.trim();
        }

        if (hasOwnKey(input.data, "inputFormat")) {
          problemUpdateData.inputFormat = input.data.inputFormat?.trim();
        }

        if (hasOwnKey(input.data, "outputFormat")) {
          problemUpdateData.outputFormat = input.data.outputFormat?.trim();
        }

        if (hasOwnKey(input.data, "constraints")) {
          problemUpdateData.constraints = input.data.constraints?.trim();
        }

        if (hasOwnKey(input.data, "difficulty") && input.data.difficulty) {
          problemUpdateData.difficulty = normalizeDifficulty(input.data.difficulty);
        }

        if (hasOwnKey(input.data, "visibility") && input.data.visibility) {
          problemUpdateData.visible = input.data.visibility;
        }

        if (hasOwnKey(input.data, "points") && input.data.points !== undefined) {
          problemUpdateData.points = input.data.points;
        }

        if (hasOwnKey(input.data, "examples")) {
          const primaryExample = getPrimaryExample(input.data.examples ?? []);
          problemUpdateData.exampleInput = primaryExample.input.trim() || null;
          problemUpdateData.exampleOutput = primaryExample.output.trim() || null;
          problemUpdateData.exampleExplanation = primaryExample.explanation.trim() || null;
        }

        if (Object.keys(problemUpdateData).length > 0) {
          await tx.problem.update({
            where: { id: input.problemId },
            data: problemUpdateData,
          });
        }

        if (hasOwnKey(input.data, "tags")) {
          const tags = normalizeTags(input.data.tags ?? []);

          await tx.topic.deleteMany({
            where: { problemId: input.problemId },
          });

          if (tags.length > 0) {
            await tx.topic.createMany({
              data: tags.map((name) => ({
                problemId: input.problemId,
                name,
              })),
            });
          }
        }

        if (hasOwnKey(input.data, "starterCodes")) {
          const starterCodeRows = input.data.starterCodes
            ? buildStarterCodeRows(input.data.starterCodes)
            : [];

          await tx.problemStarterCode.deleteMany({
            where: { problemId: input.problemId },
          });

          if (starterCodeRows.length > 0) {
            await tx.problemStarterCode.createMany({
              data: starterCodeRows.map((starterCode) => ({
                ...starterCode,
                problemId: input.problemId,
              })),
            });
          }
        }
      });

      return { id: input.problemId };
    }),
});
