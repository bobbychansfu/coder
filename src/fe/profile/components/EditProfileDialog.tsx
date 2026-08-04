"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import styles from "@/fe/profile/styles/EditProfileDialog.module.css";

export interface EditableProfile {
  computingId: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  studentNumber: string | null;
  role: "ADMIN" | "INSTRUCTOR" | "TA" | "STUDENT";
}

interface EditProfileDialogProps {
  open: boolean;
  profile: EditableProfile;
  onClose: () => void;
  onUpdated: (profile: EditableProfile) => void;
}

export default function EditProfileDialog({
  open,
  profile,
  onClose,
  onUpdated,
}: EditProfileDialogProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [studentNumber, setStudentNumber] = useState(profile.studentNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isStudent = profile.role === "STUDENT";

  useEffect(() => {
    if (!open) return;

    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setNickname(profile.nickname ?? "");
    setStudentNumber(profile.studentNumber ?? "");
    setError(null);
  }, [open, profile]);

  const canSave =
    firstName.trim().length > 0 &&
    firstName.trim().length <= 50 &&
    lastName.trim().length <= 50 &&
    nickname.trim().length <= 40 &&
    (!isStudent || studentNumber.trim().length <= 20);

  const saveProfile = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/s/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fname: firstName.trim(),
          lname: lastName.trim(),
          nickname: nickname.trim(),
          ...(isStudent ? { student_number: studentNumber.trim() } : {}),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        user?: EditableProfile;
      };

      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "Failed to update profile.");
      }

      onUpdated(payload.user);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogContent className={styles.content}>
        <Typography color="text.secondary">
          Your email and computing ID are managed by your account and cannot be edited here.
        </Typography>
        <div className={styles.nameGrid}>
          <TextField
            label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 50 } }}
            required
            fullWidth
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 50 } }}
            helperText="Optional"
            fullWidth
          />
        </div>
        <TextField label="Email" value={profile.email} disabled fullWidth />
        <TextField label="Computing ID" value={profile.computingId} disabled fullWidth />
        <TextField
          label="Nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 40 } }}
          helperText="Optional"
          fullWidth
        />
        {isStudent ? (
          <TextField
            label="Student number"
            value={studentNumber}
            onChange={(event) => setStudentNumber(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 20 } }}
            helperText="Optional"
            fullWidth
          />
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={saveProfile} disabled={!canSave || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
