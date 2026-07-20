"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";

import { adminRoleOptions, adminUsers } from "@/fe/admin/data";
import UserFiltersBar from "@/fe/admin/components/UserFiltersBar";
import UserTable from "@/fe/admin/components/UserTable";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import styles from "@/fe/admin/styles/AdminUserManagementPage.module.css";

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<(typeof adminRoleOptions)[number]["value"]>("all");
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    expiresAt: "",
  });
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestSuccess, setGuestSuccess] = useState<string | null>(null);
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [showGuestPassword, setShowGuestPassword] = useState(false);

  const createGuest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingGuest(true);
    setGuestError(null);
    setGuestSuccess(null);
    try {
      const response = await fetch("/api/admin/guest-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...guestForm,
          expiresAt: guestForm.expiresAt ? new Date(guestForm.expiresAt).toISOString() : null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setGuestError(payload?.message ?? "Unable to create guest account.");
        return;
      }
      setGuestSuccess(`Guest account “${guestForm.username}” was created.`);
      setGuestForm({ username: "", firstName: "", lastName: "", password: "", expiresAt: "" });
      setGuestDialogOpen(false);
    } catch {
      setGuestError("Unable to create guest account.");
    } finally {
      setCreatingGuest(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const query = search.trim().toLowerCase();

      if (!matchesRole) return false;
      if (!query) return true;

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [search, selectedRole]);

  const stats = useMemo(() => {
    const totalUsers = adminUsers.length;
    const studentCount = adminUsers.filter((u) => u.role === "student").length;
    const instructorCount = adminUsers.filter((u) => u.role === "instructor").length;
    const adminCount = adminUsers.filter((u) => u.role === "admin").length;

    return [
      { id: "total-users", label: "Total Users", value: String(totalUsers) },
      { id: "students", label: "Students", value: String(studentCount) },
      { id: "instructors", label: "Instructors", value: String(instructorCount) },
      { id: "admins", label: "Admins", value: String(adminCount) },
    ];
  }, []);

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.admin)}
        backLabel="Back"
        backButtonClassName={subpageStyles.backButton}
      />

      <SubpageHeader
        title="User Management"
        subtitle="Manage staff roles and local guest accounts. Students authenticate via SFU FAS."
        actions={
          <Button
            className={styles.addButton}
            variant="contained"
            startIcon={<PersonAddOutlinedIcon className={styles.addButtonIcon} />}
            onClick={() => setGuestDialogOpen(true)}
          >
            Add Guest
          </Button>
        }
      />

      {guestSuccess ? <Alert severity="success">{guestSuccess}</Alert> : null}

      <Box className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            className={styles.statCard}
            headerClassName={styles.statHeader}
            labelClassName={styles.statLabel}
            contentClassName={styles.statContent}
            valueClassName={styles.statValue}
          />
        ))}
      </Box>

      <UserFiltersBar
        search={search}
        onSearchChange={setSearch}
        selectedRole={selectedRole}
        onRoleChange={(value) =>
          setSelectedRole(value as (typeof adminRoleOptions)[number]["value"])
        }
        roleOptions={adminRoleOptions}
      />

      <UserTable users={filteredUsers} />

      <Dialog open={guestDialogOpen} onClose={() => setGuestDialogOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={(event) => void createGuest(event)}>
          <DialogTitle>Add Guest Account</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, paddingTop: "12px !important" }}>
            <TextField
              label="Username"
              value={guestForm.username}
              onChange={(event) => setGuestForm((form) => ({ ...form, username: event.target.value }))}
              autoComplete="off"
            />
            <TextField
              label="First name"
              value={guestForm.firstName}
              onChange={(event) => setGuestForm((form) => ({ ...form, firstName: event.target.value }))}
            />
            <TextField
              label="Last name"
              value={guestForm.lastName}
              onChange={(event) => setGuestForm((form) => ({ ...form, lastName: event.target.value }))}
            />
            <TextField
              label="Initial password"
              type={showGuestPassword ? "text" : "password"}
              value={guestForm.password}
              onChange={(event) => setGuestForm((form) => ({ ...form, password: event.target.value }))}
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowGuestPassword((visible) => !visible)}
                        aria-label={showGuestPassword ? "Hide password" : "Show password"}
                        aria-pressed={showGuestPassword}
                      >
                        {showGuestPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Expires at (optional)"
              type="datetime-local"
              value={guestForm.expiresAt}
              onChange={(event) => setGuestForm((form) => ({ ...form, expiresAt: event.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {guestError ? <Alert severity="error">{guestError}</Alert> : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGuestDialogOpen(false)} disabled={creatingGuest}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creatingGuest}>
              {creatingGuest ? "Creating..." : "Create Guest"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
