import { redirect } from "next/navigation";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { toContestListItem } from "@/fe/contests/services/contestAdapters";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import { getCurrentUser } from "@/lib/session";
import { getStudentContestInfoPayload, toBackendContestSummary } from "@/server/api/s/studentContestInfo";

function mapContestList(contests: Parameters<typeof toContestListItem>[0][]): ContestListItem[] {
  return contests.map(toContestListItem);
}

export default async function ContestsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = can(user.role);
  let initialContests: ContestListItem[] = [];
  let myContests: ContestListItem[] = [];
  let availableContests: ContestListItem[] = [];
  let pageErrorMessage: string | undefined;

  try {
    if (user.role === "student") {
      const contestInfoPayload = await getStudentContestInfoPayload(user);

      initialContests = mapContestList([
        ...contestInfoPayload.contests,
        ...contestInfoPayload.contestsOpen,
      ]);
      myContests = mapContestList(contestInfoPayload.contests);
      availableContests = mapContestList(contestInfoPayload.contestsOpen);
    } else {
      const publishedContests = await dbHelpers.findPublishedContestsForViewer(
        user.computingId,
        user.role,
      );
      initialContests = mapContestList(publishedContests.map(toBackendContestSummary));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server-side data load error.";
    pageErrorMessage = `Unable to load contests during SSR. Reason: server-side data load. ${message}`;

    console.error("[contests:ssr] failed direct contest load", {
      computingId: user.computingId,
      role: user.role,
      errorMessage: message,
      authBackendBaseUrl: process.env.AUTH_BACKEND_BASE_URL ?? null,
      nextPublicBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? null,
    });
  }

  return (
    <ContestsPage
      initialContests={initialContests}
      myContests={myContests}
      availableContests={availableContests}
      isStudent={user.role === "student"}
      showCreateContest={permissions.canCreateContest}
      showManageContest={permissions.canManageContest}
      showViewAllSubmissions={permissions.canViewAllSubmissions}
      pageErrorMessage={pageErrorMessage}
    />
  );
}
