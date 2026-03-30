import { notFound, redirect } from "next/navigation";
import ProblemSubmissionPage from "@/fe/contests/page/ProblemSubmissionPage";
import {
  adaptContestProblemDetail,
  type ContestProblemDetailResponse,
  type ContestProblemSubmissionsResponse,
} from "@/fe/contests/services/contestProblem";
import { getContestSummaries, toContestDetail } from "@/fe/contests/services/contestAdapters";
import {
  getContestProblemDetail,
  getContestProblemStatus,
  getContestProblemSubmissions,
  getStudentContestInfo,
} from "@/fe/contests/services/contestApi";
import { getCurrentUser } from "@/lib/session";

interface ContestProblemRouteProps {
  params: Promise<{ id: string; code: string }>;
}

export const dynamicParams = true;

export default async function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id, code } = await params;
  const contestId = id ?? "";
  const contestInfoResponse = await getStudentContestInfo();

  if (!contestInfoResponse.ok || !contestInfoResponse.data) {
    notFound();
  }

  const contestSummary = getContestSummaries(contestInfoResponse.data).find(
    (contest) => contest.id === contestId,
  );

  if (!contestSummary) {
    notFound();
  }

  const contestProblemStatusResponse = await getContestProblemStatus(contestId);

  if (!contestProblemStatusResponse.ok || !contestProblemStatusResponse.data) {
    notFound();
  }

  const contest = toContestDetail(contestSummary, contestProblemStatusResponse.data);
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
