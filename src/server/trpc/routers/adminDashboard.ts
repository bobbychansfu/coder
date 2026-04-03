import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../init";
import { loadAdminDashboardSnapshot } from "@/server/adminDashboard/repository";
import { buildAdminDashboardResponse } from "@/server/adminDashboard/serializer";

export const adminDashboardRouter = router({
  get: studentProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const snapshot = await loadAdminDashboardSnapshot(ctx.prisma, ctx.user.computingId);
    if (!snapshot) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
    }

    return buildAdminDashboardResponse(snapshot);
  }),
});
