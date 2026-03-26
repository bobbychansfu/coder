import type { PracticeSubmissionPayload } from "@/lib/practiceSubmission";

type PracticeSubmissionEventName =
  | "connected"
  | PracticeSubmissionPayload["status"];

type PracticeSubmissionListener = (
  eventName: PracticeSubmissionEventName,
  payload: PracticeSubmissionPayload,
) => void;

class PracticeSubmissionEventBus {
  private listeners = new Map<string, Set<PracticeSubmissionListener>>();

  subscribe(submissionId: string, listener: PracticeSubmissionListener): () => void {
    const group = this.listeners.get(submissionId) ?? new Set<PracticeSubmissionListener>();
    group.add(listener);
    this.listeners.set(submissionId, group);

    return () => {
      const current = this.listeners.get(submissionId);
      if (!current) {
        return;
      }

      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(submissionId);
      }
    };
  }

  publish(eventName: PracticeSubmissionPayload["status"], payload: PracticeSubmissionPayload) {
    const current = this.listeners.get(payload.submissionId);
    if (!current) {
      return;
    }

    for (const listener of current) {
      listener(eventName, payload);
    }
  }
}

const globalForPracticeSubmissionEvents = globalThis as unknown as {
  practiceSubmissionEvents?: PracticeSubmissionEventBus;
};

export const practiceSubmissionEvents =
  globalForPracticeSubmissionEvents.practiceSubmissionEvents ??
  new PracticeSubmissionEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForPracticeSubmissionEvents.practiceSubmissionEvents = practiceSubmissionEvents;
}
