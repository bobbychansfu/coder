import { notFound, redirect } from "next/navigation";
import ContestDetailPage from "@/fe/contests/page/ContestDetailPage";
import { toContestDetail } from "@/fe/contests/services/contestAdapters";
import {
  type BackendContestSummary,
  getContestProblemStatus,
  getStudentContestInfoForRoute,
} from "@/fe/contests/services/contestApi";
import { can } from "@/lib/authz";
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
    status: contest.status,
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
    contest = await dbHelpers.findContest(contestId);
  } else {
    const contestInfoResponse = await getStudentContestInfoForRoute(contestId, user.role);

    if (!contestInfoResponse.ok || !contestInfoResponse.data) {
      notFound();
    }

    contest = contestInfoResponse.data.contests.find((item) => item.id === contestId) ?? null;
  }

  if (!contest) {
    notFound();
  }

  const contestProblemStatusResponse = await getContestProblemStatus(contestId);
  const normalizedContest = isBackendContestSummary(contest)
    ? contest
    : toBackendContestSummary(contest);

  return (
    <ContestDetailPage
      contest={toContestDetail(
        normalizedContest,
        contestProblemStatusResponse.ok ? contestProblemStatusResponse.data : null,
      )}
    />
  );
}
