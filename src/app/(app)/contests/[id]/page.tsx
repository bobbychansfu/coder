import { notFound, redirect } from "next/navigation";
import ContestDetailPage from "@/fe/contests/page/ContestDetailPage";
import { toContestDetail } from "@/fe/contests/services/contestAdapters";
import {
  type BackendContestSummary,
  type ContestProblemStatusResponse,
} from "@/fe/contests/services/contestApi";
import { can, normalizeRole } from "@/lib/authz";
import { getEffectiveContestStatus } from "@/lib/contestStatus";
import { dbHelpers } from "@/lib/db-helpers";
import { getCurrentUser } from "@/lib/session";

interface ContestDetailRouteProps {
  params: Promise<{ id: string }>;
}

function toBackendContestSummary(
  contest: NonNullable<Awaited<ReturnType<typeof dbHelpers.findContest>>>,
): BackendContestSummary {
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
  };
}

function isBackendContestSummary(
  contest: BackendContestSummary | NonNullable<Awaited<ReturnType<typeof dbHelpers.findContest>>>,
): contest is BackendContestSummary {
  return typeof contest.startsAt === "string";
}

async function getContestProblemStatusDirect(
  computingId: string,
  contestId: string,
  role: string,
): Promise<ContestProblemStatusResponse | null> {
  const normalizedRole = normalizeRole(role);
  const contest = normalizedRole && can(normalizedRole).canManageContest
    ? await dbHelpers.findContestForViewer(contestId, computingId, role)
    : await dbHelpers.findSpecificContestForUser(computingId, contestId, "contestant");

  if (!contest || !contest.published || contest.status === "DRAFT") {
    return null;
  }

  const [contestProblemsStatus, scoreboard] = await Promise.all([
    dbHelpers.findContestsProblemsStatusForUser(computingId, contestId),
    dbHelpers.findScoreboardRowsForContest(contestId, computingId),
  ]);

  return {
    computingId,
    contestProblemsStatus,
    scoreboard,
    role,
  };
}

export const dynamicParams = true;

export default async function ContestDetailRoute({ params }: ContestDetailRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const contestId = id ?? "";
  let contest = null;

  if (can(user.role).canManageContest) {
    contest = await dbHelpers.findContestForViewer(contestId, user.computingId, user.role);
  } else {
    const registeredContests = await dbHelpers.findContestsForUser(user.computingId, "contestant");
    contest = registeredContests.find((item) => item.id === contestId) ?? null;
  }

  if (!contest) {
    notFound();
  }

  const contestProblemStatus = await getContestProblemStatusDirect(
    user.computingId,
    contestId,
    user.role,
  );
  if (!contestProblemStatus) {
    notFound();
  }

  const normalizedContest = isBackendContestSummary(contest)
    ? contest
    : toBackendContestSummary(contest);

  return (
    <ContestDetailPage
      contest={toContestDetail(
        normalizedContest,
        contestProblemStatus,
      )}
    />
  );
}
