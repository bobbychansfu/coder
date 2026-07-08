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
  type ContestProblemStatusResponse,
} from "@/fe/contests/services/contestApi";
import { can, normalizeRole } from "@/lib/authz";
import { getEffectiveContestStatus } from "@/lib/contestStatus";
import { dbHelpers } from "@/lib/db-helpers";
import { getCurrentUser } from "@/lib/session";
import { codingLanguageToLabel } from "@/server/coding-language";

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
    status: getEffectiveContestStatus(contest),
    startsAt: contest.startsAt.toISOString(),
    endsAt: contest.endsAt?.toISOString() ?? null,
    durationMinutes: contest.durationMinutes,
    participants: contest.participants,
    published: contest.published,
    aiHintEnabled: contest.aiHintEnabled,
  };
}

function isBackendContestSummary(
  contest: BackendContestSummary | NonNullable<Awaited<ReturnType<typeof dbHelpers.findContest>>>,
): contest is BackendContestSummary {
  return typeof contest.startsAt === "string";
}

function isContestViewableByRegisteredUser(contest: { published: boolean; status: string }) {
  return contest.published && contest.status !== "DRAFT";
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

  if (!contest || !isContestViewableByRegisteredUser(contest)) {
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

export default async function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id, code } = await params;
  const contestId = id ?? "";
  let contestSummary = null;

  if (can(user.role).canManageContest) {
    contestSummary = await dbHelpers.findContestForViewer(contestId, user.computingId, user.role);
  } else {
    contestSummary = await dbHelpers.findSpecificContestForUser(
      user.computingId,
      contestId,
      "contestant",
    );
  }

  if (!contestSummary || !isContestViewableByRegisteredUser(contestSummary)) {
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

  const normalizedContestSummary = isBackendContestSummary(contestSummary)
    ? contestSummary
    : toBackendContestSummary(contestSummary);
  const contest = toContestDetail(normalizedContestSummary, contestProblemStatus);
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
  const [problemDetail, submissions] = await Promise.all([
    dbHelpers.findProblemWithDetails(problem.problemId),
    dbHelpers.findSubmissionsForProblem(user.computingId, contestId, problem.problemId),
  ]);

  if (!problemDetail) {
    notFound();
  }

  const problemDetailPayload: ContestProblemDetailResponse = {
    computingId: user.computingId,
    cid: contestId,
    pid: problem.problemId,
    problem: problemDetail,
    downloadContents: [],
    role: user.role,
    htmlContents: [],
  };
  const problemSubmissionsPayload: ContestProblemSubmissionsResponse = {
    computingId: user.computingId,
    problem: problemDetail,
    submissions: submissions.map((submission) => ({
      id: submission.id,
      status: submission.status,
      language: submission.language,
      languageLabel: codingLanguageToLabel(submission.language),
      createdAt: submission.createdAt.toISOString(),
      score: submission.score,
      runtime: null,
      memory: null,
      judgeOutput: submission.judgeOutput ?? "",
    })),
  };

  return (
    <ProblemSubmissionPage
      contestId={contest.id}
      contestStatus={contest.status}
      contestEndsAt={normalizedContestSummary.endsAt}
      aiHintEnabled={normalizedContestSummary.aiHintEnabled}
      detail={adaptContestProblemDetail(
        problem,
        problemDetailPayload,
        problemSubmissionsPayload,
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
