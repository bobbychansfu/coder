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
  const [registeredContests, openContests] = await Promise.all([
    dbHelpers.findContestsForUser(user.computingId, "contestant"),
    dbHelpers.findOpenContestsForUser(user.computingId, "contestant"),
  ]);

  const registeredContestSummaries = registeredContests.map(toBackendContestSummary);
  const openContestSummaries = openContests
    .map(toBackendContestSummary)
    .filter((contest) => isJoinableContestStatus(contest.status));

  return {
    computingId: user.computingId,
    role: user.role,
    contests: registeredContestSummaries,
    contestsOpen: openContestSummaries,
  };
}
