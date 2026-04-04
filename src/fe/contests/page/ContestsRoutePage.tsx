import { redirect } from "next/navigation";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { getContestSummaries, toContestListItem } from "@/fe/contests/services/contestAdapters";
import { getStudentContestInfo } from "@/fe/contests/services/contestApi";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

function mapContestList(contests: Parameters<typeof toContestListItem>[0][]): ContestListItem[] {
  return contests.map(toContestListItem);
}

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
  const myContests =
    contestInfoResponse.ok && contestInfoResponse.data
      ? mapContestList(contestInfoResponse.data.contests)
      : [];
  const availableContests =
    contestInfoResponse.ok && contestInfoResponse.data
      ? mapContestList(contestInfoResponse.data.contestsOpen)
      : [];

  return (
    <ContestsPage
      initialContests={initialContests}
      myContests={myContests}
      availableContests={availableContests}
      isStudent={user.role === "student"}
      showCreateContest={permissions.canCreateContest}
      showManageContest={permissions.canManageContest}
      showViewAllSubmissions={permissions.canViewAllSubmissions}
    />
  );
}
