import type { Notification, Prisma } from "@prisma/client";
import type { VerdictNotificationData } from "@/lib/notifications";

interface JudgedSubmission {
  id: string;
  userId: string;
  contestId: string;
  problemId: string;
  // The team the submission was made for; every member hears the verdict
  teamId: string | null;
  status: string;
}

// One notification per recipient: the submitter and everyone on the team it was made for.
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
    submission.teamId
      ? tx.team.findUnique({
          where: { id: submission.teamId },
          select: { members: { select: { userId: true } } },
        })
      : null,
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
