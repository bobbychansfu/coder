import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { loadInstructorAnalysisSnapshot } from "@/server/instructorAnalysis/repository";
import { buildInstructorAnalysisResponse } from "@/server/instructorAnalysis/serializer";

const instructorAnalysisInputSchema = z.object({
  contestId: z.string().optional(),
  problemId: z.string().optional(),
  snapshotPreference: z.enum(["latest", "preliminary", "final"]).default("latest"),
});

export const instructorAnalysisRouter = router({
  get: protectedProcedure
    .input(instructorAnalysisInputSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "instructor") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const snapshot = await loadInstructorAnalysisSnapshot(
        ctx.prisma,
        ctx.user.computingId,
        input,
      );
      if (!snapshot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Instructor not found" });
      }

      return buildInstructorAnalysisResponse(snapshot);
    }),
});
