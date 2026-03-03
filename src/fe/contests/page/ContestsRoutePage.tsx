import { redirect } from "next/navigation";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { contestList } from "@/fe/contests/data/contests";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function ContestsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = can(user.role);

  return (
    <ContestsPage
      initialContests={contestList}
      showCreateContest={permissions.canCreateContest}
      showManageContest={permissions.canManageContest}
      showViewAllSubmissions={permissions.canViewAllSubmissions}
    />
  );
}
