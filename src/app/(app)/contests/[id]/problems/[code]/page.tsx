import { notFound, redirect } from "next/navigation";
import ProblemSubmissionPage from "@/fe/contests/page/ProblemSubmissionPage";
import {
  adaptContestProblemDetail,
  type ContestProblemDetailResponse,
  type ContestProblemSubmissionsResponse,
} from "@/fe/contests/services/contestProblem";
import { toContestDetail } from "@/fe/contests/services/contestAdapters";
import {
  type BackendContestSummary,
  getContestProblemDetail,
  getContestProblemStatus,
  getContestProblemSubmissions,
  getStudentContestInfoForRoute,
} from "@/fe/contests/services/contestApi";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import { getCurrentUser } from "@/lib/session";

interface ContestProblemRouteProps {
  params: Promise<{ id: string; code: string }>;
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

export default async function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id, code } = await params;
  const contestId = id ?? "";
  let contestSummary = null;

  if (can(user.role).canManageContest) {
    contestSummary = await dbHelpers.findContest(contestId);
  } else {
    const contestInfoResponse = await getStudentContestInfoForRoute(contestId, user.role);

    if (!contestInfoResponse.ok || !contestInfoResponse.data) {
      notFound();
    }

    contestSummary =
      contestInfoResponse.data.contests.find((contest) => contest.id === contestId) ?? null;
  }

  if (!contestSummary) {
    notFound();
  }

  const contestProblemStatusResponse = await getContestProblemStatus(contestId);

  if (!contestProblemStatusResponse.ok || !contestProblemStatusResponse.data) {
    notFound();
  }

  const normalizedContestSummary = isBackendContestSummary(contestSummary)
    ? contestSummary
    : toBackendContestSummary(contestSummary);
  const contest = toContestDetail(normalizedContestSummary, contestProblemStatusResponse.data);
  const problemCode = (code ?? contest.problems[0]?.code ?? "A").toUpperCase();
  const problemIndex = contest.problems.findIndex((item) => item.code.toUpperCase() === problemCode);
  const problem = problemIndex >= 0 ? contest.problems[problemIndex] : undefined;

  if (!problem?.problemId) {
    notFound();
  }

  const previousProblem = problemIndex > 0 ? contest.problems[problemIndex - 1] : undefined;
  const nextProblem =
    problemIndex >= 0 && problemIndex < contest.problems.length - 1
      ? contest.problems[problemIndex + 1]
      : undefined;
  const [problemDetailResponse, problemSubmissionsResponse] = await Promise.all([
    getContestProblemDetail(contestId, problem.problemId),
    getContestProblemSubmissions(contestId, problem.problemId),
  ]);

  if (!problemDetailResponse.ok || !problemDetailResponse.data) {
    notFound();
  }

  return (
    <ProblemSubmissionPage
      contestId={contest.id}
      contestStatus={contest.status}
      detail={adaptContestProblemDetail(
        problem,
        problemDetailResponse.data as ContestProblemDetailResponse,
        problemSubmissionsResponse.ok
          ? (problemSubmissionsResponse.data as ContestProblemSubmissionsResponse)
          : null,
      )}
      navigator={{
        position: problemIndex + 1,
        total: contest.problems.length,
        previousHref: previousProblem
          ? `/contests/${contest.id}/problems/${previousProblem.code.toLowerCase()}`
          : undefined,
        nextHref: nextProblem
          ? `/contests/${contest.id}/problems/${nextProblem.code.toLowerCase()}`
          : undefined,
      }}
    />
  );
}
