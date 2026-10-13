import type { Notification, Prisma } from "@prisma/client";
import type { NotificationPayload, VerdictNotificationData } from "@/lib/notifications";
import { notificationEvents } from "./notificationEvents";

interface JudgedSubmission {
  id: string;
  userId: string;
  contestId: string;
  problemId: string;
  status: string;
}

// One notification per recipient: the submitter and, in a team contest, every teammate.
export async function createVerdictNotifications(
  tx: Prisma.TransactionClient,
  submission: JudgedSubmission,
): Promise<Notification[]> {
  const [contestProblems, problem, submitter, team] = await Promise.all([
    tx.contestProblem.findMany({
      where: { contestId: submission.contestId },
      orderBy: { ordering: "asc" },
      select: { problemId: true },
    }),
    tx.problem.findUnique({ where: { id: submission.problemId }, select: { title: true } }),
    tx.user.findUnique({
      where: { id: submission.userId },
      select: { firstName: true, lastName: true, computingId: true },
    }),
    tx.team.findFirst({
      where: { contestId: submission.contestId, members: { some: { userId: submission.userId } } },
      select: { members: { select: { userId: true } } },
    }),
  ]);

  const index = contestProblems.findIndex((row) => row.problemId === submission.problemId);
  if (index < 0 || !problem || !submitter) {
    return [];
  }

  const recipients = new Set([submission.userId, ...(team?.members.map((m) => m.userId) ?? [])]);
  const base = {
    contestId: submission.contestId,
    problemId: submission.problemId,
    problemCode: String.fromCharCode(65 + index),
    problemTitle: problem.title,
    submissionId: submission.id,
    status: submission.status,
    submitterName:
      `${submitter.firstName} ${submitter.lastName}`.trim() || submitter.computingId,
  };

  return tx.notification.createManyAndReturn({
    data: [...recipients].map((userId) => ({
      userId,
      type: "VERDICT" as const,
      contestId: submission.contestId,
      data: {
        ...base,
        submittedBySelf: userId === submission.userId,
      } satisfies VerdictNotificationData,
    })),
  });
}

export function toNotificationPayload(row: Notification): NotificationPayload {
  return {
    id: row.id,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    data: row.data as unknown as VerdictNotificationData,
  };
}

// Call after the transaction commits, so listeners never see rolled-back rows
export function publishNotifications(rows: Notification[]) {
  for (const row of rows) {
    notificationEvents.publish(row.userId, toNotificationPayload(row));
  }
}
