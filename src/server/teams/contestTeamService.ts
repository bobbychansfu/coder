import type { Prisma } from "@prisma/client";

// Every contestant is on exactly one team per contest: a team of one until they
// accept an invite. These helpers keep that true wherever people register or submit.

type Tx = Prisma.TransactionClient;

export function teamDisplayName(user: {
  nickname: string | null;
  firstName: string;
  lastName: string;
  computingId: string;
}) {
  return user.nickname?.trim() || `${user.firstName} ${user.lastName}`.trim() || user.computingId;
}

// The contestant's team, creating their team of one if they have none yet
export async function ensureContestTeam(tx: Tx, contestId: string, userId: string): Promise<string> {
  const membership = await tx.teamMember.findUnique({
    where: { contestId_userId: { contestId, userId } },
    select: { teamId: true },
  });
  if (membership) {
    return membership.teamId;
  }

  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { nickname: true, firstName: true, lastName: true, computingId: true },
  });
  const team = await tx.team.create({
    data: {
      name: teamDisplayName(user),
      contestId,
      members: { create: { userId, contestId } },
    },
    select: { id: true },
  });
  return team.id;
}

export async function teamHasSubmissions(tx: Tx, teamId: string) {
  return (await tx.submission.count({ where: { teamId } })) > 0;
}

export async function userHasContestSubmissions(tx: Tx, contestId: string, userId: string) {
  return (await tx.submission.count({ where: { contestId, userId } })) > 0;
}

// Takes the user off their team; a team left empty (with no results) is deleted
export async function removeFromContestTeam(tx: Tx, contestId: string, userId: string) {
  const membership = await tx.teamMember.findUnique({
    where: { contestId_userId: { contestId, userId } },
    select: { id: true, teamId: true },
  });
  if (!membership) {
    return;
  }

  await tx.teamMember.delete({ where: { id: membership.id } });
  const remaining = await tx.teamMember.count({ where: { teamId: membership.teamId } });
  if (remaining === 0 && !(await teamHasSubmissions(tx, membership.teamId))) {
    await tx.team.delete({ where: { id: membership.teamId } });
  }
}
