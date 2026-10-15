import type { Notification } from "@prisma/client";
import type {
  NotificationPayload,
  TeamInviteNotificationData,
  VerdictNotificationData,
} from "@/lib/notifications";
import { notificationEvents } from "./notificationEvents";

export function toNotificationPayload(row: Notification): NotificationPayload {
  const base = {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
  return row.type === "VERDICT"
    ? { ...base, type: "VERDICT", data: row.data as unknown as VerdictNotificationData }
    : { ...base, type: "TEAM_INVITE", data: row.data as unknown as TeamInviteNotificationData };
}

// Call after the transaction commits, so listeners never see rolled-back rows
export function publishNotifications(rows: Notification[]) {
  for (const row of rows) {
    notificationEvents.publish(row.userId, toNotificationPayload(row));
  }
}
