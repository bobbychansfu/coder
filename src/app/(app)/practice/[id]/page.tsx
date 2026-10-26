import { redirect } from "next/navigation";
import PracticeProblemSubmissionPage from "@/fe/practice/page/PracticeProblemSubmissionPage";
import { loginPath } from "@/lib/loginPath";
import { getCurrentUser } from "@/lib/session";
import { isJudgeMode } from "@/server/practice/submissionService";
import { getAiHintsEnabled } from "@/server/siteSettings";

interface PracticeProblemRouteProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PracticeProblemRoute({ params }: PracticeProblemRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(await loginPath());
  }

  const { id } = await params;
  const judgeMode = isJudgeMode();
  return (
    <PracticeProblemSubmissionPage
      problemCode={id}
      persistSubmissions={user.role === "student"}
      judgeMode={judgeMode}
      currentUserComputingId={user.computingId}
      aiHintsEnabled={await getAiHintsEnabled()}
    />
  );
}
