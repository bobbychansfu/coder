import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { codingLanguageToAppLanguage, codingLanguageToLabel } from "@/server/coding-language";
import { teamDisplayName } from "@/server/teams/contestTeamService";

interface SubmissionViewer {
  computingId: string;
  // Instructors and admins see every team's submissions
  isStaff: boolean;
}

// The submissions a viewer may see in a contest: staff see all; a student sees their own
// and their team's. A submission belongs to the team it was made for; rows from before
// teams were recorded count for the submitter's current team, as on the scoreboard.
async function visibleSubmissionsFilter(
  contestId: string,
  viewer: SubmissionViewer,
): Promise<{ where: Prisma.SubmissionWhereInput; userId: string | null } | null> {
  const user = await prisma.user.findUnique({
    where: { computingId: viewer.computingId },
    select: { id: true },
  });

  if (viewer.isStaff) {
    return { where: { contestId }, userId: user?.id ?? null };
  }

  if (!user) {
    return null;
  }

  const membership = await prisma.teamMember.findUnique({
    where: { contestId_userId: { contestId, userId: user.id } },
    select: { teamId: true, team: { select: { members: { select: { userId: true } } } } },
  });
  const teamFilters: Prisma.SubmissionWhereInput[] = membership
    ? [
        { teamId: membership.teamId },
        { teamId: null, userId: { in: membership.team.members.map((member) => member.userId) } },
      ]
    : [];

  return {
    where: { contestId, OR: [{ userId: user.id }, ...teamFilters] },
    userId: user.id,
  };
}

const submitterSelect = {
  computingId: true,
  nickname: true,
  firstName: true,
  lastName: true,
} as const;

export async function listVisibleContestSubmissions(
  contestId: string,
  viewer: SubmissionViewer,
  problemId?: string,
) {
  const filter = await visibleSubmissionsFilter(contestId, viewer);
  if (!filter) {
    return [];
  }

  const submissions = await prisma.submission.findMany({
    where: { ...filter.where, ...(problemId ? { problemId } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      problemId: true,
      userId: true,
      status: true,
      language: true,
      score: true,
      createdAt: true,
      judgeOutput: Boolean(problemId),
      user: { select: submitterSelect },
      team: { select: { name: true } },
    },
  });

  return submissions.map((submission) => ({
    id: submission.id,
    problemId: submission.problemId,
    status: submission.status,
    language: submission.language,
    languageLabel: codingLanguageToLabel(submission.language),
    score: submission.score,
    createdAt: submission.createdAt.toISOString(),
    judgeOutput: submission.judgeOutput ?? null,
    // Staff tell teams apart; students tell teammates apart
    by: viewer.isStaff
      ? (submission.team?.name ?? teamDisplayName(submission.user))
      : teamDisplayName(submission.user),
    isOwn: submission.userId === filter.userId,
  }));
}

export type VisibleContestSubmission = Awaited<
  ReturnType<typeof listVisibleContestSubmissions>
>[number];

// One submission with its code, or null when the viewer may not see it
export async function findVisibleContestSubmission(
  submissionId: string,
  contestId: string,
  viewer: SubmissionViewer,
) {
  const filter = await visibleSubmissionsFilter(contestId, viewer);
  if (!filter) {
    return null;
  }

  const submission = await prisma.submission.findFirst({
    where: { AND: [filter.where, { id: submissionId }] },
    select: {
      id: true,
      problemId: true,
      userId: true,
      submission: true,
      status: true,
      language: true,
      score: true,
      createdAt: true,
      user: { select: submitterSelect },
      team: { select: { name: true } },
    },
  });

  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    problemId: submission.problemId,
    code: submission.submission ?? "",
    status: submission.status,
    language: codingLanguageToAppLanguage(submission.language),
    languageLabel: codingLanguageToLabel(submission.language),
    score: submission.score,
    createdAt: submission.createdAt.toISOString(),
    author: teamDisplayName(submission.user),
    // Students already know their own team
    team: viewer.isStaff ? (submission.team?.name ?? null) : null,
    isOwn: submission.userId === filter.userId,
  };
}
