"use client";

import { useRouter } from "next/navigation";
import { Alert, Box, Button, Typography } from "@mui/material";
import { trpc } from "@/lib/trpc/client";
import styles from "@/fe/contests/styles/ContestTeamControls.module.css";

interface TeamInviteResponseProps {
  contestId: string;
  token: string;
  contestName: string;
  teamName: string;
  invitedByName: string;
  memberNames: string[];
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  forViewer: boolean;
}

const CLOSED_MESSAGES = {
  ACCEPTED: "You've already accepted this invite.",
  DECLINED: "You declined this invite.",
  REVOKED: "This invite was withdrawn.",
};

export default function TeamInviteResponse({
  contestId,
  token,
  contestName,
  teamName,
  invitedByName,
  memberNames,
  status,
  forViewer,
}: TeamInviteResponseProps) {
  const router = useRouter();
  const respond = trpc.contestTeams.respondToInvite.useMutation({
    onSuccess: () => router.push(`/contests/${contestId}`),
  });

  return (
    <Box className={styles.invitePage}>
      <Box className={styles.inviteCard}>
        <Typography className={styles.teamName}>Join {teamName}?</Typography>
        <Typography color="text.secondary">
          {invitedByName} invited you to their team in {contestName}.
        </Typography>
        <Typography className={styles.studentMeta} color="text.secondary">
          Members: {memberNames.join(", ")}
        </Typography>

        {!forViewer ? (
          <Alert severity="warning">This invite is for a different account.</Alert>
        ) : status !== "PENDING" ? (
          <Alert severity="info">{CLOSED_MESSAGES[status]}</Alert>
        ) : (
          <>
            <Typography className={styles.studentMeta} color="text.secondary">
              You can join only if you haven&apos;t submitted in this contest yet. Once your team
              has submitted, you stay on it until the contest ends.
            </Typography>
            {respond.error ? <Alert severity="error">{respond.error.message}</Alert> : null}
            <Box className={styles.rowActions}>
              <Button
                variant="contained"
                color="error"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ token, accept: true })}
              >
                Join team
              </Button>
              <Button
                disabled={respond.isPending}
                onClick={() => respond.mutate({ token, accept: false })}
              >
                Decline
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
