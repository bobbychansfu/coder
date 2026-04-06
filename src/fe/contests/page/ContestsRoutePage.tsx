import { redirect } from "next/navigation";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestsPage from "@/fe/contests/page/ContestsPage";
import { getContestSummaries, toContestListItem } from "@/fe/contests/services/contestAdapters";
import type {
  BackendContestSummary,
  StudentContestInfoResponse,
} from "@/fe/contests/services/contestApi";
import { can } from "@/lib/authz";
import { dbHelpers } from "@/lib/db-helpers";
import { getCurrentUser } from "@/lib/session";

function mapContestList(contests: Parameters<typeof toContestListItem>[0][]): ContestListItem[] {
  return contests.map(toContestListItem);
}

type ContestListRecord = Awaited<ReturnType<typeof dbHelpers.findContestsForUser>>[number];

function toBackendContestSummary(contest: ContestListRecord): BackendContestSummary {
  return {
    id: contest.id,
    slug: contest.slug,
    name: contest.name,
    status: contest.status,
    startsAt: contest.startsAt.toISOString(),
    endsAt: contest.endsAt?.toISOString() ?? null,
    durationMinutes: contest.durationMinutes,
    participants: contest.participants,
    published: contest.published,
  };
}

export default async function ContestsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = can(user.role);
  let contestInfoPayload: StudentContestInfoResponse | null = null;
  let pageErrorMessage: string | undefined;

  try {
    const [registeredContests, openContests] = await Promise.all([
      dbHelpers.findContestsForUser(user.computingId, "contestant"),
      dbHelpers.findOpenContestsForUser(user.computingId, "contestant"),
    ]);

    contestInfoPayload = {
      computingId: user.computingId,
      role: user.role,
      contests: registeredContests.map(toBackendContestSummary),
      contestsOpen: openContests.map(toBackendContestSummary),
    };
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

  const initialContests = contestInfoPayload
    ? getContestSummaries(contestInfoPayload).map(toContestListItem)
    : [];
  const myContests = contestInfoPayload ? mapContestList(contestInfoPayload.contests) : [];
  const availableContests = contestInfoPayload ? mapContestList(contestInfoPayload.contestsOpen) : [];

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
