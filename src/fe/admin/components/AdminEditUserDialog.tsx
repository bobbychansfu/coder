"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { AdminUserRecord } from "@/fe/admin/data";
import styles from "@/fe/admin/styles/AdminEditUserDialog.module.css";
import { trpc } from "@/lib/trpc/client";

interface AdminEditUserDialogProps {
  user: AdminUserRecord;
  onClose: () => void;
  onUpdated: (message: string) => void;
}

export default function AdminEditUserDialog({
  user,
  onClose,
  onUpdated,
}: AdminEditUserDialogProps) {
  const [form, setForm] = useState<AdminUserRecord>(user);
  const updateUser = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      onUpdated("User information updated.");
      onClose();
    },
  });

  const canSave =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.computingId.trim().length > 0 &&
    form.email.trim().length > 0 &&
    Number.isInteger(form.pointsAcquired) &&
    Number.isInteger(form.problemsSolved) &&
    Number.isInteger(form.competitionsParticipated) &&
    form.pointsAcquired >= 0 &&
    form.problemsSolved >= 0 &&
    form.competitionsParticipated >= 0;

  return (
    <Dialog open onClose={() => !updateUser.isPending && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>Edit user</DialogTitle>
      <DialogContent className={styles.content}>
        {form.isCurrentUser ? (
          <Alert severity="info">You can edit your account, but you cannot remove your own admin role.</Alert>
        ) : null}
        <div className={styles.grid}>
          <TextField
            label="First name"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <TextField
            label="Computing ID"
            value={form.computingId}
            disabled={form.isCurrentUser}
            onChange={(event) => setForm({ ...form, computingId: event.target.value })}
            required
          />
          <TextField
            label="Nickname"
            value={form.nickname ?? ""}
            onChange={(event) => setForm({ ...form, nickname: event.target.value })}
          />
          <TextField
            label="Student number"
            value={form.studentNumber ?? ""}
            onChange={(event) => setForm({ ...form, studentNumber: event.target.value })}
          />
          <TextField
            select
            label="Role"
            value={form.databaseRole}
            disabled={form.isCurrentUser}
            onChange={(event) =>
              setForm({
                ...form,
                databaseRole: event.target.value as AdminUserRecord["databaseRole"],
              })
            }
          >
            <MenuItem value="STUDENT">Student</MenuItem>
            <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
            <MenuItem value="TA">TA</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
          <TextField
            label="Rank"
            value={form.rank ?? ""}
            onChange={(event) => setForm({ ...form, rank: event.target.value })}
          />
          <TextField
            label="Points acquired"
            type="number"
            value={form.pointsAcquired}
            onChange={(event) => setForm({ ...form, pointsAcquired: Number(event.target.value) })}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            label="Problems solved"
            type="number"
            value={form.problemsSolved}
            onChange={(event) => setForm({ ...form, problemsSolved: Number(event.target.value) })}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            label="Competitions participated"
            type="number"
            value={form.competitionsParticipated}
            onChange={(event) =>
              setForm({ ...form, competitionsParticipated: Number(event.target.value) })
            }
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField label="Courses" value={form.courses} disabled />
          <TextField label="Last active" value={form.lastActive} disabled />
        </div>
        <Typography color="text.secondary" className={styles.note}>
          Courses and last-active time are derived from platform activity and cannot be edited directly.
        </Typography>
        {updateUser.error ? <Alert severity="error">{updateUser.error.message}</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={updateUser.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!canSave || updateUser.isPending}
          onClick={() =>
            updateUser.mutate({
              id: form.id,
              computingId: form.computingId,
              email: form.email,
              firstName: form.firstName,
              lastName: form.lastName,
              nickname: form.nickname || null,
              studentNumber: form.studentNumber || null,
              role: form.databaseRole,
              pointsAcquired: form.pointsAcquired,
              problemsSolved: form.problemsSolved,
              competitionsParticipated: form.competitionsParticipated,
              rank: form.rank || null,
            })
          }
        >
          {updateUser.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
