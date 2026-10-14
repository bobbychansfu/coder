import { notFound, redirect } from "next/navigation";
import { dbHelpers } from "@/lib/db-helpers";

/**
 * For a student who cannot open a contest: returns the contest when they may still
 * register for it (the page then shows an invitation). Otherwise this never returns —
 * it sends them to 403 when the contest exists but is closed to them (private, ended,
 * archived), and to 404 only when students cannot see it at all (missing, draft,
 * unpublished, deleted).
 */
export async function findContestInvitationOrDeny(computingId: string, contestId: string) {
  const joinable = await dbHelpers.findJoinableContestForUser(computingId, contestId, "contestant");
  if (joinable) {
    return joinable;
  }

  const contest = await dbHelpers.findContest(contestId);
  if (contest && contest.published && contest.status !== "DRAFT") {
    redirect("/403");
  }

  notFound();
}
