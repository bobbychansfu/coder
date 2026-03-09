import PracticeProblemSubmissionPage from "@/fe/practice/page/PracticeProblemSubmissionPage";

interface PracticeProblemRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PracticeProblemRoute({ params }: PracticeProblemRouteProps) {
  const { id } = await params;
  return <PracticeProblemSubmissionPage problemCode={id} />;
}
