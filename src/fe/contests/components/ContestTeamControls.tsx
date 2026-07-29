"use client";

import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { trpc } from "@/lib/trpc/client";
import styles from "@/fe/contests/styles/ContestTeamControls.module.css";

interface ContestTeamControlsProps {
  contestId: string;
}

interface AvailableStudent {
  id: string;
  name: string;
  computingId: string;
  email: string;
}

export default function ContestTeamControls({ contestId }: ContestTeamControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const teamQuery = trpc.contestTeams.get.useQuery({ contestId }, { retry: false });
  const createTeam = trpc.contestTeams.create.useMutation({
    onSuccess: async () => {
      setDialogOpen(false);
      setTeamName("");
      setSelectedStudentIds([]);
      await teamQuery.refetch();
    },
  });

  if (teamQuery.data?.currentTeam) {
    return (
      <Alert severity="info" className={styles.teamNotice}>
        You are already in a team: {teamQuery.data.currentTeam.name}
      </Alert>
    );
  }

  if (teamQuery.isError) {
    return (
      <Alert severity="warning" className={styles.teamNotice}>
        Team creation is unavailable. Apply the latest database migration and refresh.
      </Alert>
    );
  }

  return (
    <>
      <Button
        variant="contained"
        color="error"
        startIcon={<GroupAddOutlinedIcon />}
        className={styles.createButton}
        disabled={teamQuery.isLoading}
        onClick={() => {
          createTeam.reset();
          setDialogOpen(true);
        }}
      >
        Create Team
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={() => !createTeam.isPending && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create a team of three</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography color="text.secondary">
            You are the first member. Select exactly two available students registered for this
            contest.
          </Typography>
          <TextField
            label="Team name"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 50 } }}
            fullWidth
          />
          <Box className={styles.studentList}>
            {(teamQuery.data?.availableStudents.length ?? 0) === 0 ? (
              <Typography color="text.secondary" className={styles.emptyState}>
                No students are currently available.
              </Typography>
            ) : (
              teamQuery.data?.availableStudents.map((student: AvailableStudent) => {
                const selected = selectedStudentIds.includes(student.id);
                const selectionFull = selectedStudentIds.length >= 2;

                return (
                  <FormControlLabel
                    key={student.id}
                    className={styles.studentOption}
                    control={
                      <Checkbox
                        checked={selected}
                        disabled={!selected && selectionFull}
                        onChange={(event) =>
                          setSelectedStudentIds((current) =>
                            event.target.checked
                              ? [...current, student.id]
                              : current.filter((id) => id !== student.id),
                          )
                        }
                      />
                    }
                    label={
                      <Box>
                        <Typography className={styles.studentName}>{student.name}</Typography>
                        <Typography color="text.secondary" className={styles.studentMeta}>
                          {student.computingId} · {student.email}
                        </Typography>
                      </Box>
                    }
                  />
                );
              })
            )}
          </Box>
          <Typography color="text.secondary" className={styles.selectionCount}>
            {selectedStudentIds.length} of 2 students selected
          </Typography>
          {createTeam.error ? <Alert severity="error">{createTeam.error.message}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={createTeam.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={
              createTeam.isPending ||
              teamName.trim().length === 0 ||
              selectedStudentIds.length !== 2
            }
            onClick={() =>
              createTeam.mutate({
                contestId,
                name: teamName,
                memberUserIds: selectedStudentIds,
              })
            }
          >
            {createTeam.isPending ? "Creating…" : "Create team"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
