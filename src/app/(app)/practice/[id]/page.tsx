import { notFound } from "next/navigation";
import PracticeProblemSubmissionPage from "@/fe/practice/page/PracticeProblemSubmissionPage";
import { practiceProblems } from "@/fe/practice/data/practiceProblems";
import { getPracticeProblemDetail } from "@/fe/practice/data/practiceProblemDetails";

interface PracticeProblemRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return practiceProblems.map((problem) => ({ id: problem.id }));
}

export default async function PracticeProblemRoute({ params }: PracticeProblemRouteProps) {
  const { id } = await params;
  const detail = getPracticeProblemDetail(id);

  if (!detail) {
    notFound();
  }

  return <PracticeProblemSubmissionPage detail={detail} />;
}
