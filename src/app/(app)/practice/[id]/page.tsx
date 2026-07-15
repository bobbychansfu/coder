import { redirect } from "next/navigation";
import PracticeProblemSubmissionPage from "@/fe/practice/page/PracticeProblemSubmissionPage";
import { getCurrentUser } from "@/lib/session";

interface PracticeProblemRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PracticeProblemRoute({ params }: PracticeProblemRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  return (
    <PracticeProblemSubmissionPage
      problemCode={id}
      persistSubmissions={user.role === "student"}
      currentUserComputingId={user.computingId}
    />
  );
}
