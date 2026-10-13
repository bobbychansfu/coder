"use client";

import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { trpc } from "@/lib/trpc/client";
import styles from "@/fe/contests/styles/ContestTeamControls.module.css";

interface ContestTeamControlsProps {
  contestId: string;
}

interface InvitableStudent {
  id: string;
  name: string;
  email: string;
}

// Every typed word must start the student's name or email.
function matchesPrefixSearch(student: InvitableStudent, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const words = [...student.name.toLowerCase().split(/\s+/), student.email.toLowerCase()];
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

function inviteLink(contestId: string, token: string) {
  return `${window.location.origin}/contests/${contestId}/invites/${token}`;
}

// Everyone registered is on a team (a team of one at first). This shows it and lets
// members invite people, who join only once they accept.
export default function ContestTeamControls({ contestId }: ContestTeamControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const teamQuery = trpc.contestTeams.get.useQuery({ contestId }, { retry: false });
  const refetch = () => teamQuery.refetch();
  const rename = trpc.contestTeams.rename.useMutation({
    onSuccess: async () => {
      setEditingName(null);
      await refetch();
    },
  });
  const invite = trpc.contestTeams.invite.useMutation({ onSuccess: refetch });
  const revokeInvite = trpc.contestTeams.revokeInvite.useMutation({ onSuccess: refetch });
  const leave = trpc.contestTeams.leave.useMutation({ onSuccess: refetch });

  const data = teamQuery.data;
  // Not registered, or an individual contest: there is no team to show
  if (!data || data.maxTeamSize <= 1) {
    return null;
  }

  const { team } = data;
  const error = rename.error ?? invite.error ?? revokeInvite.error ?? leave.error;
  const visibleStudents = data.invitableStudents.filter((student) =>
    matchesPrefixSearch(student, search),
  );

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(inviteLink(contestId, token));
    setCopiedToken(token);
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        startIcon={<GroupsOutlinedIcon />}
        className={styles.createButton}
        onClick={() => {
          setSearch("");
          setEditingName(null);
          setCopiedToken(null);
          setDialogOpen(true);
        }}
      >
        Team · {team.members.length} of {data.maxTeamSize}
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your team</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          {editingName === null ? (
            <Box className={styles.teamNameRow}>
              <Typography className={styles.teamName}>{team.name}</Typography>
              <Button size="small" onClick={() => setEditingName(team.name)}>
                Rename
              </Button>
            </Box>
          ) : (
            <Box className={styles.teamNameRow}>
              <TextField
                label="Team name"
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 50 } }}
                size="small"
                fullWidth
                autoFocus
              />
              <Button
                variant="contained"
                color="error"
                disabled={rename.isPending || editingName.trim().length === 0}
                onClick={() => rename.mutate({ contestId, name: editingName })}
              >
                Save
              </Button>
            </Box>
          )}

          <Box className={styles.studentList}>
            {team.members.map((member) => (
              <Box key={member.id} className={styles.studentOption}>
                <Typography className={styles.studentName}>
                  {member.name}
                  {member.isYou ? " (you)" : ""}
                </Typography>
              </Box>
            ))}
            {team.pendingInvites.map((pending) => (
              <Box key={pending.id} className={styles.studentOption}>
                <Box>
                  <Typography className={styles.studentName}>{pending.name}</Typography>
                  <Typography color="text.secondary" className={styles.studentMeta}>
                    Invited, waiting for them to accept
                  </Typography>
                </Box>
                <Box className={styles.rowActions}>
                  <Button size="small" onClick={() => void copyLink(pending.token)}>
                    {copiedToken === pending.token ? "Link copied" : "Copy invite link"}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={revokeInvite.isPending}
                    onClick={() => revokeInvite.mutate({ contestId, inviteId: pending.id })}
                  >
                    Revoke
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          {data.canInvite ? (
            <>
              <TextField
                label="Invite a teammate"
                placeholder="Name or email"
                type="search"
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                fullWidth
              />
              <Box className={styles.studentList}>
                {data.invitableStudents.length === 0 ? (
                  <Typography color="text.secondary" className={styles.emptyState}>
                    No one can be invited right now. Teammates need to register for the contest
                    and not have submitted yet.
                  </Typography>
                ) : visibleStudents.length === 0 ? (
                  <Typography color="text.secondary" className={styles.emptyState}>
                    No students match “{search.trim()}”.
                  </Typography>
                ) : (
                  visibleStudents.map((student) => (
                    <Box key={student.id} className={styles.studentOption}>
                      <Box>
                        <Typography className={styles.studentName}>{student.name}</Typography>
                        <Typography color="text.secondary" className={styles.studentMeta}>
                          {student.email}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        disabled={invite.isPending}
                        onClick={() => invite.mutate({ contestId, userId: student.id })}
                      >
                        Invite
                      </Button>
                    </Box>
                  ))
                )}
              </Box>
            </>
          ) : null}

          <Typography color="text.secondary" className={styles.studentMeta}>
            Teams have up to {data.maxTeamSize} people. Invited students join once they accept,
            any time before the contest ends, as long as they haven&apos;t submitted yet.
          </Typography>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
        </DialogContent>
        <DialogActions>
          {data.canLeave ? (
            <Button color="error" disabled={leave.isPending} onClick={() => leave.mutate({ contestId })}>
              Leave team
            </Button>
          ) : null}
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
