import { redirect } from "next/navigation";
import ContestRegisterInvite from "@/fe/contests/components/ContestRegisterInvite";
import { can } from "@/lib/authz";
import { getEffectiveContestStatus } from "@/lib/contestStatus";
import { dbHelpers } from "@/lib/db-helpers";
import { loginPath } from "@/lib/loginPath";
import { getCurrentUser } from "@/lib/session";

interface ContestJoinRouteProps {
  params: Promise<{ id: string; code: string }>;
}

// Where a private contest's join link lands. Opening it changes nothing; registering
// through it adds you to the contest's allowlist. Anyone the link can't help (already
// registered, wrong code, contest closed) goes on to the contest page.
export default async function ContestJoinRoute({ params }: ContestJoinRouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(await loginPath());
  }

  const { id, code } = await params;
  const contest = can(user.role).canManageContest
    ? null
    : await dbHelpers.findJoinableContestForUser(user.computingId, id, "contestant", code);

  if (!contest) {
    redirect(`/contests/${encodeURIComponent(id)}`);
  }

  return (
    <ContestRegisterInvite
      contestId={contest.id}
      name={contest.name}
      statusLabel={getEffectiveContestStatus(contest) === "ACTIVE" ? "In progress" : "Upcoming"}
      startsAtIso={contest.startsAt.toISOString()}
      joinCode={code}
    />
  );
}
