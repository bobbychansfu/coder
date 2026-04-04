import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../init";
import { loadAdminDashboardSnapshot } from "@/server/adminDashboard/repository";
import { buildAdminDashboardResponse } from "@/server/adminDashboard/serializer";

export const adminDashboardRouter = router({
  get: adminProcedure.query(async ({ ctx }) => {
    const snapshot = await loadAdminDashboardSnapshot(ctx.prisma, ctx.user.computingId);
    if (!snapshot) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });
    }

    return buildAdminDashboardResponse(snapshot);
  }),
});
