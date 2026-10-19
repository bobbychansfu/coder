import type {
  BackendContestSummary,
  StudentContestInfoResponse,
} from "@/fe/contests/services/contestApi";
import { dbHelpers } from "@/lib/db-helpers";
import { getEffectiveContestStatus, isJoinableContestStatus } from "@/lib/contestStatus";
import type { CurrentUser } from "@/lib/session";

type ContestListRecord =
  | Awaited<ReturnType<typeof dbHelpers.findContestsForUser>>[number]
  | Awaited<ReturnType<typeof dbHelpers.findPublishedContests>>[number];

export function toBackendContestSummary(contest: ContestListRecord): BackendContestSummary {
  return {
    id: contest.id,
    slug: contest.slug,
    name: contest.name,
    status: getEffectiveContestStatus(contest),
    startsAt: contest.startsAt.toISOString(),
    endsAt: contest.endsAt?.toISOString() ?? null,
    durationMinutes: contest.durationMinutes,
    participants: contest.participants,
    published: contest.published,
    aiHintEnabled: contest.aiHintEnabled,
  };
}

export async function getStudentContestInfoPayload(
  user: Pick<CurrentUser, "computingId" | "role">,
): Promise<StudentContestInfoResponse> {
  const [registeredContests, openContests, upsolvingContests] = await Promise.all([
    dbHelpers.findContestsForUser(user.computingId, "contestant"),
    dbHelpers.findOpenContestsForUser(user.computingId, "contestant"),
    dbHelpers.findUpsolvingContestsForUser(user.computingId),
  ]);

  const registeredContestSummaries = registeredContests.map(toBackendContestSummary);
  // Contests they can still join, plus ended ones opened to everyone for upsolving
  const openContestSummaries = [
    ...openContests
      .map(toBackendContestSummary)
      .filter((contest) => isJoinableContestStatus(contest.status)),
    ...upsolvingContests.map(toBackendContestSummary),
  ];

  return {
    computingId: user.computingId,
    role: user.role,
    contests: registeredContestSummaries,
    contestsOpen: openContestSummaries,
  };
}
