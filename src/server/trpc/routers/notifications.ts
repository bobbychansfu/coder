import { protectedProcedure, router, type Context } from "../init";
import { toNotificationPayload } from "@/server/notifications/verdictNotifications";

async function findDbUserId(ctx: Context & { user: NonNullable<Context["user"]> }) {
  const user = await ctx.prisma.user.findUnique({
    where: { computingId: ctx.user.computingId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export const notificationsRouter = router({
  // The bell's dropdown: newest first, with the unread count for the badge
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = await findDbUserId(ctx);
    if (!userId) {
      return { notifications: [], unreadCount: 0 };
    }

    const [rows, unreadCount] = await Promise.all([
      ctx.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      ctx.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { notifications: rows.map(toNotificationPayload), unreadCount };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = await findDbUserId(ctx);
    if (userId) {
      await ctx.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return { ok: true };
  }),
});
