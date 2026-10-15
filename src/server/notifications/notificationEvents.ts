import type { NotificationPayload } from "@/lib/notifications";

type NotificationListener = (notification: NotificationPayload) => void;

// Per-user fan-out to open notification streams. Like the practice submission
// events, it lives in this server process, so it assumes a single coder server.
class NotificationEventBus {
  private listeners = new Map<string, Set<NotificationListener>>();

  subscribe(userId: string, listener: NotificationListener): () => void {
    const group = this.listeners.get(userId) ?? new Set<NotificationListener>();
    group.add(listener);
    this.listeners.set(userId, group);

    return () => {
      const current = this.listeners.get(userId);
      if (!current) {
        return;
      }

      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(userId);
      }
    };
  }

  publish(userId: string, notification: NotificationPayload) {
    for (const listener of this.listeners.get(userId) ?? []) {
      listener(notification);
    }
  }
}

const globalForNotificationEvents = globalThis as unknown as {
  notificationEvents?: NotificationEventBus;
};

// Kept on globalThis so the judge callback and the stream route share one bus
export const notificationEvents = (globalForNotificationEvents.notificationEvents ??=
  new NotificationEventBus());
