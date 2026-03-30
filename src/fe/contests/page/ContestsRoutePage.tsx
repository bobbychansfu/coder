import { redirect } from "next/navigation";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { getContestSummaries, toContestListItem } from "@/fe/contests/services/contestAdapters";
import { getStudentContestInfo } from "@/fe/contests/services/contestApi";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function ContestsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = can(user.role);
  const contestInfoResponse = await getStudentContestInfo();
  const initialContests =
    contestInfoResponse.ok && contestInfoResponse.data
      ? getContestSummaries(contestInfoResponse.data).map(toContestListItem)
      : [];

  return (
    <ContestsPage
      initialContests={initialContests}
      showCreateContest={permissions.canCreateContest}
      showManageContest={permissions.canManageContest}
      showViewAllSubmissions={permissions.canViewAllSubmissions}
    />
  );
}
