import { notFound } from "next/navigation";
import ContestDetailPage from "@/fe/contests/page/ContestDetailPage";
import { contestDetailsById } from "@/fe/contests/data/contestDetails";

interface ContestDetailRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return Object.keys(contestDetailsById).map((id) => ({ id }));
}

export default async function ContestDetailRoute({ params }: ContestDetailRouteProps) {
  const { id } = await params;
  const contestId = id ?? "contest-1";
  const contest =
    contestDetailsById[contestId] ??
    contestDetailsById["contest-1"] ??
    Object.values(contestDetailsById)[0];

  if (!contest) {
    notFound();
  }

  return <ContestDetailPage contest={contest} />;
}
