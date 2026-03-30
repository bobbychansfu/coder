import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../init";
import { loadInstructorDashboardSnapshot } from "@/server/instructorDashboard/repository";
import { buildInstructorDashboardResponse } from "@/server/instructorDashboard/serializer";

export const instructorDashboardRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "instructor") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const snapshot = await loadInstructorDashboardSnapshot(ctx.prisma, ctx.user.computingId);
    if (!snapshot) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Instructor not found" });
    }

    return buildInstructorDashboardResponse(snapshot);
  }),
});
