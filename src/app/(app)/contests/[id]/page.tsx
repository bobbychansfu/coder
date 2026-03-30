import { notFound, redirect } from "next/navigation";
import ContestDetailPage from "@/fe/contests/page/ContestDetailPage";
import { getContestSummaries, toContestDetail } from "@/fe/contests/services/contestAdapters";
import { getContestProblemStatus, getStudentContestInfo } from "@/fe/contests/services/contestApi";
import { getCurrentUser } from "@/lib/session";

interface ContestDetailRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export default async function ContestDetailRoute({ params }: ContestDetailRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const contestId = id ?? "";
  const contestInfoResponse = await getStudentContestInfo();

  if (!contestInfoResponse.ok || !contestInfoResponse.data) {
    notFound();
  }

  const contest = getContestSummaries(contestInfoResponse.data).find((item) => item.id === contestId);

  if (!contest) {
    notFound();
  }

  const contestProblemStatusResponse = await getContestProblemStatus(contestId);

  return (
    <ContestDetailPage
      contest={toContestDetail(
        contest,
        contestProblemStatusResponse.ok ? contestProblemStatusResponse.data : null,
      )}
    />
  );
}
