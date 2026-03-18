import { notFound } from "next/navigation";
import ProblemSubmissionPage from "@/fe/contests/page/ProblemSubmissionPage";
import { contestDetailsById } from "@/fe/contests/data/contestDetails";
import { buildProblemDetail } from "@/fe/contests/data/problemDetails";

interface ContestProblemRouteProps {
  params: Promise<{ id: string; code: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return Object.values(contestDetailsById).flatMap((contest) =>
    contest.problems.map((problem) => ({
      id: contest.id,
      code: problem.code.toLowerCase(),
    })),
  );
}

export default async function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const { id, code } = await params;
  const contestId = id ?? "contest-1";
  const contest =
    contestDetailsById[contestId] ??
    contestDetailsById["contest-1"] ??
    Object.values(contestDetailsById)[0];

  if (!contest) {
    notFound();
  }

  const problemCode = (code ?? contest.problems[0]?.code ?? "A").toUpperCase();
  const problemIndex = contest.problems.findIndex((item) => item.code.toUpperCase() === problemCode);
  const problem = problemIndex >= 0 ? contest.problems[problemIndex] : undefined;

  if (!problem) {
    notFound();
  }

  const previousProblem = problemIndex > 0 ? contest.problems[problemIndex - 1] : undefined;
  const nextProblem =
    problemIndex >= 0 && problemIndex < contest.problems.length - 1
      ? contest.problems[problemIndex + 1]
      : undefined;

  return (
    <ProblemSubmissionPage
      detail={buildProblemDetail(problem)}
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
