import { redirect } from "next/navigation";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { toContestListItem } from "@/fe/contests/services/contestAdapters";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import { loginPath } from "@/lib/loginPath";
import { getCurrentUser } from "@/lib/session";
import { getStudentContestInfoPayload, toBackendContestSummary } from "@/server/api/s/studentContestInfo";

function mapContestList(contests: Parameters<typeof toContestListItem>[0][]): ContestListItem[] {
  return contests.map(toContestListItem);
}

export default async function ContestsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(await loginPath());
  }

  const permissions = can(user.role);
  let initialContests: ContestListItem[] = [];
  let myContests: ContestListItem[] = [];
  let availableContests: ContestListItem[] = [];
  let pastContests: ContestListItem[] = [];
  let pageErrorMessage: string | undefined;

  try {
    if (user.role === "student") {
      const contestInfoPayload = await getStudentContestInfoPayload(user);

      initialContests = mapContestList([
        ...contestInfoPayload.contests,
        ...contestInfoPayload.contestsOpen,
      ]);
      // Ended contests, their own and those opened for upsolving, go under Past, as on
      // Codeforces and Kattis
      const registered = mapContestList(contestInfoPayload.contests);
      const open = mapContestList(contestInfoPayload.contestsOpen);
      myContests = registered.filter((contest) => contest.status !== "Closed");
      availableContests = open.filter((contest) => contest.status !== "Closed");
      pastContests = [...registered, ...open].filter((contest) => contest.status === "Closed");
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
      pastContests={pastContests}
      isStudent={user.role === "student"}
      showCreateContest={permissions.canCreateContest}
      showManageContest={permissions.canManageContest}
      showViewAllSubmissions={permissions.canViewAllSubmissions}
      pageErrorMessage={pageErrorMessage}
    />
  );
}
