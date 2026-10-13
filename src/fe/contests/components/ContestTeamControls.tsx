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

import { CONTEST_TEAM_MAX_TEAMMATES } from "@/lib/contestTeamSize";
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

// Every typed word must start the student's first or last name, computing ID, or email.
function matchesPrefixSearch(student: AvailableStudent, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const words = [
    ...student.name.toLowerCase().split(/\s+/),
    student.computingId.toLowerCase(),
    student.email.toLowerCase(),
  ];
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

export default function ContestTeamControls({ contestId }: ContestTeamControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const teamQuery = trpc.contestTeams.get.useQuery({ contestId }, { retry: false });
  const createTeam = trpc.contestTeams.create.useMutation({
    onSuccess: async () => {
      setDialogOpen(false);
      setTeamName("");
      setSearch("");
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

  const availableStudents: AvailableStudent[] = teamQuery.data?.availableStudents ?? [];
  // Ticked students stay visible so a search never hides who is already on the team.
  const visibleStudents = availableStudents.filter(
    (student) => selectedStudentIds.includes(student.id) || matchesPrefixSearch(student, search),
  );

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
          setSearch("");
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
        <DialogTitle>Create a team</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography color="text.secondary">
            You are the first member. Add up to {CONTEST_TEAM_MAX_TEAMMATES} available students
            registered for this contest, or create the team on your own.
          </Typography>
          <TextField
            label="Team name"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 50 } }}
            fullWidth
          />
          <TextField
            label="Search students"
            placeholder="Name, computing ID or email"
            type="search"
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
          />
          <Box className={styles.studentList}>
            {availableStudents.length === 0 ? (
              <Typography color="text.secondary" className={styles.emptyState}>
                No students are currently available.
              </Typography>
            ) : visibleStudents.length === 0 ? (
              <Typography color="text.secondary" className={styles.emptyState}>
                No students match “{search.trim()}”.
              </Typography>
            ) : (
              visibleStudents.map((student) => {
                const selected = selectedStudentIds.includes(student.id);
                const selectionFull = selectedStudentIds.length >= CONTEST_TEAM_MAX_TEAMMATES;

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
            {selectedStudentIds.length} of up to {CONTEST_TEAM_MAX_TEAMMATES} teammates selected
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
            disabled={createTeam.isPending || teamName.trim().length === 0}
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
