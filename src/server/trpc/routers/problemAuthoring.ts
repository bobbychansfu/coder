import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { can } from "@/lib/authz";
import { APP_LANGUAGES } from "@/server/coding-language";
import { publicProcedure, router } from "../init";

const starterLanguageSchema = z.enum(APP_LANGUAGES);

const generatedStarterCodesSchema = z
  .object({
    cplusplus: z.string().min(1).optional(),
    java: z.string().min(1).optional(),
    python: z.string().min(1).optional(),
    typescript: z.string().min(1).optional(),
    javascript: z.string().min(1).optional(),
  })
  .partial();

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
});
