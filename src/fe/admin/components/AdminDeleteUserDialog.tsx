"use client";

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

import type { AdminUserRecord } from "@/fe/admin/data";
import { trpc } from "@/lib/trpc/client";

interface AdminDeleteUserDialogProps {
  user: AdminUserRecord | null;
  onClose: () => void;
  onDeleted: (message: string) => void;
}

export default function AdminDeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: AdminDeleteUserDialogProps) {
  const deleteUser = trpc.adminUsers.delete.useMutation({
    onSuccess: (result) => {
      onDeleted(`${result.name} was deleted.`);
      onClose();
    },
  });

  return (
    <Dialog
      open={Boolean(user)}
      onClose={() => !deleteUser.isPending && onClose()}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Delete user</DialogTitle>
      <DialogContent>
        <Typography>
          Delete <strong>{user?.name}</strong>?
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          This permanently deletes the account and associated submissions, participation records,
          activities, and team memberships.
        </Alert>
        {deleteUser.error ? <Alert severity="error" sx={{ mt: 2 }}>{deleteUser.error.message}</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleteUser.isPending}>
          Keep user
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!user || user.isCurrentUser || deleteUser.isPending}
          onClick={() => user && deleteUser.mutate({ id: user.id })}
        >
          {deleteUser.isPending ? "Deleting…" : "Delete user"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
