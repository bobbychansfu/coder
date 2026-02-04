import { notFound } from "next/navigation";
import ProblemSubmissionPage from "@/fe/contests/page/ProblemSubmissionPage";
import { contestDetailsById } from "@/fe/contests/data/contestDetails";
import { buildProblemDetail } from "@/fe/contests/data/problemDetails";

interface ContestProblemRouteProps {
  params: { id: string; code: string };
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

export default function ContestProblemRoute({ params }: ContestProblemRouteProps) {
  const contestId = params?.id ?? "contest-1";
  const contest =
    contestDetailsById[contestId] ??
    contestDetailsById["contest-1"] ??
    Object.values(contestDetailsById)[0];

  if (!contest) {
    notFound();
  }

  const problemCode = (params?.code ?? contest.problems[0]?.code ?? "A").toUpperCase();
  const problem = contest.problems.find((item) => item.code.toUpperCase() === problemCode);

  if (!problem) {
    notFound();
  }

  return <ProblemSubmissionPage detail={buildProblemDetail(problem)} />;
}
