import { notFound, redirect } from "next/navigation";
import TeamInviteResponse from "@/fe/contests/components/TeamInviteResponse";
import { prisma } from "@/lib/prisma";
import { loginPath } from "@/lib/loginPath";
import { getCurrentUser } from "@/lib/session";
import { teamDisplayName } from "@/server/teams/contestTeamService";

interface TeamInviteRouteProps {
  params: Promise<{ id: string; token: string }>;
}

const nameSelect = { nickname: true, firstName: true, lastName: true, computingId: true } as const;

// Where an invite link lands. Opening it changes nothing; only Join or Decline do.
export default async function TeamInviteRoute({ params }: TeamInviteRouteProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(await loginPath());
  }

  const { id, token } = await params;
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    select: {
      status: true,
      invitedUser: { select: { computingId: true } },
      invitedBy: { select: nameSelect },
      team: {
        select: {
          name: true,
          contestId: true,
          contest: { select: { name: true } },
          members: { select: { user: { select: nameSelect } } },
        },
      },
    },
  });

  if (!invite || invite.team.contestId !== id || !invite.team.contest) {
    notFound();
  }

  return (
    <TeamInviteResponse
      contestId={id}
      token={token}
      contestName={invite.team.contest.name}
      teamName={invite.team.name}
      invitedByName={teamDisplayName(invite.invitedBy)}
      memberNames={invite.team.members.map(({ user: member }) => teamDisplayName(member))}
      status={invite.status}
      forViewer={invite.invitedUser.computingId === user.computingId}
    />
  );
}
