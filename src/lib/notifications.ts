// Shapes shared by the notification server code and the navbar bell / toasts.

export interface VerdictNotificationData {
  contestId: string;
  problemId: string;
  // The problem's contest letter, e.g. "C"
  problemCode: string;
  problemTitle: string;
  submissionId: string;
  // A SubmissionStatus other than PENDING
  status: string;
  submitterName: string;
  // False when a teammate submitted
  submittedBySelf: boolean;
}

export interface TeamInviteNotificationData {
  contestId: string;
  contestName: string;
  teamName: string;
  invitedByName: string;
  // Opens the confirmation page, where the invitee accepts or declines
  token: string;
}

interface NotificationBase {
  id: string;
  createdAt: string;
  readAt: string | null;
}

export type NotificationPayload =
  | (NotificationBase & { type: "VERDICT"; data: VerdictNotificationData })
  | (NotificationBase & { type: "TEAM_INVITE"; data: TeamInviteNotificationData });

export const VERDICT_LABELS: Record<string, string> = {
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  RUNTIME_ERROR: "Runtime Error",
  COMPILE_ERROR: "Compile Error",
  SYSTEM_ERROR: "System Error",
};

// "C — Accepted", plus who submitted when it was a teammate
export function describeVerdict(data: VerdictNotificationData): string {
  const verdict = `${data.problemCode} — ${VERDICT_LABELS[data.status] ?? data.status}`;
  return data.submittedBySelf ? verdict : `${verdict} by ${data.submitterName}`;
}

export function contestProblemHref(data: VerdictNotificationData): string {
  return `/contests/${data.contestId}/problems/${data.problemCode.toLowerCase()}`;
}

export function teamInviteHref(data: TeamInviteNotificationData): string {
  return `/contests/${data.contestId}/invites/${data.token}`;
}

export function notificationHref(notification: NotificationPayload): string {
  return notification.type === "VERDICT"
    ? contestProblemHref(notification.data)
    : teamInviteHref(notification.data);
}
