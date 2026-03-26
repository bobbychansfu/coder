"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

interface ExitConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExitConfirmDialog({ open, onConfirm, onCancel }: ExitConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Unsaved changes</DialogTitle>
      <DialogContent>
        <Typography>You have unsaved changes. Leave without saving?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined">Stay</Button>
        <Button onClick={onConfirm} variant="contained" color="error">Leave</Button>
      </DialogActions>
    </Dialog>
  );
}
