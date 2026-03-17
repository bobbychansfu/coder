import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";
import { loadDashboardMetadataSnapshot } from "@/server/dashboardMetadata/repository";
import { buildStudentDashboardMetadataResponse } from "@/server/dashboardMetadata/serializer";

export const dashboardMetadataRouter = router({
  getStudent: studentProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "student") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const snapshot = await loadDashboardMetadataSnapshot(ctx.prisma, ctx.user.computingId);
    if (!snapshot) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student not found" });
    }

    return buildStudentDashboardMetadataResponse(snapshot);
  }),
});
