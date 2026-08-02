"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  Chip,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";


import { adminRoleOptions, type AdminUserRecord } from "@/fe/admin/data";
import AdminDeleteUserDialog from "@/fe/admin/components/AdminDeleteUserDialog";
import AdminEditUserDialog from "@/fe/admin/components/AdminEditUserDialog";
import UserFiltersBar from "@/fe/admin/components/UserFiltersBar";
import UserTable from "@/fe/admin/components/UserTable";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import styles from "@/fe/admin/styles/AdminUserManagementPage.module.css";
import { formatAdminUserLastActive } from "@/fe/admin/services/adminUsers";
import { trpc } from "@/lib/trpc/client";

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
  const [guestUsers, setGuestUsers] = useState<AdminUserRecord[]>([]);

  const loadGuestUsers = useCallback(async () => {
    const response = await fetch("/api/admin/guest-users", { credentials: "include" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      users: Array<{ id: string; name: string; username: string; lastActive: string | null }>;
    };
    setGuestUsers(
      payload.users.map((guest) => ({
        id: guest.id,
        computingId: guest.username,
        firstName: guest.name.split(" ")[0] || "Guest",
        lastName: guest.name.split(" ").slice(1).join(" ") || "User",
        name: guest.username,
        email: "",
        role: "guest",
        databaseRole: "STUDENT",
        nickname: null,
        studentNumber: null,
        pointsAcquired: 0,
        problemsSolved: 0,
        competitionsParticipated: 0,
        rank: null,
        isCurrentUser: false,
        courses: 0,
        lastActive: guest.lastActive
          ? new Date(guest.lastActive).toLocaleString()
          : "Never",
      })),
    );
  }, []);

  useEffect(() => {
    void loadGuestUsers();
  }, [loadGuestUsers]);

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
      await loadGuestUsers();
    } catch {
      setGuestError("Unable to create guest account.");
    } finally {
      setCreatingGuest(false);
    }
  };
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupSize, setGroupSize] = useState(3);
  const [groupResult, setGroupResult] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [modifyGroupsOpen, setModifyGroupsOpen] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [deleteScope, setDeleteScope] = useState<"selected" | "all" | null>(null);
  const [teamWarningDismissed, setTeamWarningDismissed] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUserRecord | null>(null);
  const [userActionResult, setUserActionResult] = useState<string | null>(null);
  const teamSummary = trpc.adminTeams.summary.useQuery();
  const createGroups = trpc.adminTeams.createGroups.useMutation({
    onSuccess: async (result) => {
      setGroupResult(
        `Created ${result.teamsCreated} groups and assigned ${result.studentsAssigned} students.`,
      );
      setGroupDialogOpen(false);
      await teamSummary.refetch();
    },
  });
  const deleteGroups = trpc.adminTeams.deleteGroups.useMutation({
    onSuccess: async (result) => {
      setGroupResult(
        `Deleted ${result.teamsDeleted} ${result.teamsDeleted === 1 ? "group" : "groups"}. Students can now be reassigned.`,
      );
      setDeleteScope(null);
      setModifyGroupsOpen(false);
      setSelectedTeamIds([]);
      await teamSummary.refetch();
    },
  });
  const updateMembers = trpc.adminTeams.updateMembers.useMutation({
    onSuccess: async (result) => {
      setGroupResult(
        `Updated group membership. The group now has ${result.membersUpdated} ${result.membersUpdated === 1 ? "student" : "students"}.`,
      );
      setEditingTeamId(null);
      setDraftMemberIds([]);
      await teamSummary.refetch();
    },
  });
  const adminUsers = useMemo(
    () =>
      (teamSummary.data?.users ?? []).map((user) => ({
        ...user,
        lastActive: formatAdminUserLastActive(user.lastActive),
      })),
    [teamSummary.data?.users],
  );

  const filteredUsers = useMemo(() => {
    return [...adminUsers, ...guestUsers].filter((user) => {
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const query = search.trim().toLowerCase();

      if (!matchesRole) return false;
      if (!query) return true;

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [adminUsers, guestUsers, search, selectedRole]);

  const stats = useMemo(() => {
    const allUsers = [...adminUsers, ...guestUsers];
    const totalUsers = allUsers.length;
    const studentCount = adminUsers.filter((u) => u.role === "student").length;
    const instructorCount = adminUsers.filter((u) => u.role === "instructor").length;
    const guestCount = guestUsers.length;

    return [
      { id: "total-users", label: "Total Users", value: String(totalUsers) },
      { id: "students", label: "Students", value: String(studentCount) },
      { id: "instructors", label: "Instructors", value: String(instructorCount) },
      { id: "guests", label: "Guests", value: String(guestCount) },
    ];
  }, [adminUsers, guestUsers]);

  const visibleUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 5);
  const editingTeam = teamSummary.data?.teams.find((team) => team.id === editingTeamId);
  const unavailableStudentIds = new Set(
    teamSummary.data?.teams
      .filter((team) => team.id !== editingTeamId)
      .flatMap((team) => team.members.map((member) => member.userId)) ?? [],
  );
  const allGroups = teamSummary.data?.teams ?? [];
  const visibleGroups = showAllGroups ? allGroups : allGroups.slice(0, 4);

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

      {guestSuccess ? 
         <Alert severity="success">{guestSuccess}</Alert> : null
      }
      {teamSummary.isError && (
        <Alert severity="error">Unable to load users from the database.</Alert>
      )}
      {userActionResult ? (
        <Alert severity="success" onClose={() => setUserActionResult(null)}>
          {userActionResult}
        </Alert>
      ) : null}

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
      <Box className={styles.userListControls}>
        <Typography color="text.secondary" className={styles.userListCount}>
          Showing {visibleUsers.length} of {filteredUsers.length} users
        </Typography>
        {filteredUsers.length > 5 && (
          <Button
            className={styles.viewAllButton}
            onClick={() => setShowAllUsers((current) => !current)}
          >
            {showAllUsers ? "Show fewer" : "View all users"}
          </Button>
        )}
      </Box>

      <UserTable
        users={visibleUsers}
        onEditUser={(user) => {
          setUserActionResult(null);
          setEditingUser(user);
        }}
        onDeleteUser={(user) => {
          setUserActionResult(null);
          setDeletingUser(user);
        }}
      />

      <Box className={styles.groupsSection}>
        <Box className={styles.groupsHeadingRow}>
          <Box>
            <Typography component="h2" className={styles.groupsTitle}>
              Student Groups
            </Typography>
            <Typography color="text.secondary" className={styles.groupsSubtitle}>
              Groups and memberships created by administrators.
            </Typography>
          </Box>
          <Box className={styles.groupHeadingActions}>
            <Button
              className={styles.groupButton}
              variant="outlined"
              startIcon={<GroupsOutlinedIcon className={styles.addButtonIcon} />}
            onClick={() => {
              setGroupResult(null);
              setTeamWarningDismissed(false);
              createGroups.reset();
                setGroupDialogOpen(true);
              }}
            >
              Create Student Groups
            </Button>
            <Button
              className={styles.modifyGroupsButton}
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              disabled={(teamSummary.data?.teamCount ?? 0) === 0}
              onClick={() => {
                setSelectedTeamIds([]);
                deleteGroups.reset();
                setModifyGroupsOpen(true);
              }}
            >
              Modify groups
            </Button>
            <Chip
              label={`${teamSummary.data?.teamCount ?? 0} groups`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {groupResult && (
          <Alert
            severity="success"
            className={styles.groupNotice}
            onClose={() => setGroupResult(null)}
          >
            {groupResult}
          </Alert>
        )}
        {teamSummary.data && !teamSummary.data.teamsAvailable && !teamWarningDismissed && (
          <Alert
            severity="warning"
            className={styles.groupNotice}
            onClose={() => setTeamWarningDismissed(true)}
          >
            Users loaded, but the Team tables are unavailable. Apply the team migration and restart the development server.
          </Alert>
        )}

        {!teamSummary.isLoading && allGroups.length > 0 && (
          <Box className={styles.groupListControls}>
            <Typography color="text.secondary" className={styles.userListCount}>
              Showing {visibleGroups.length} of {allGroups.length} groups
            </Typography>
            {allGroups.length > 4 && (
              <Button
                className={styles.viewAllButton}
                onClick={() => setShowAllGroups((current) => !current)}
              >
                {showAllGroups ? "Show fewer" : "View all groups"}
              </Button>
            )}
          </Box>
        )}

        {teamSummary.isLoading ? (
          <Typography color="text.secondary">Loading groups…</Typography>
        ) : (teamSummary.data?.teams.length ?? 0) === 0 ? (
          <Typography color="text.secondary" className={styles.emptyGroups}>
            No student groups have been created yet.
          </Typography>
        ) : (
          <Box className={styles.groupsGrid}>
            {visibleGroups.map((team) => (
              <Box key={team.id} className={styles.groupCard}>
                <Box className={styles.groupCardHeader}>
                  <Typography component="h3" className={styles.groupName}>
                    {team.name}
                  </Typography>
                  <Typography color="text.secondary" className={styles.memberCount}>
                    {team.members.length} {team.members.length === 1 ? "student" : "students"}
                  </Typography>
                </Box>
                <Box className={styles.memberList}>
                  {team.members.map((member) => (
                    <Box key={member.id} className={styles.memberRow}>
                      <Box>
                        <Typography className={styles.memberName}>{member.name}</Typography>
                        <Typography color="text.secondary" className={styles.memberEmail}>
                          {member.email}
                        </Typography>
                      </Box>
                      <Chip label={member.computingId} size="small" />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={modifyGroupsOpen}
        onClose={() => !deleteGroups.isPending && setModifyGroupsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modify student groups</DialogTitle>
        <DialogContent className={styles.groupDialogContent}>
          <Typography color="text.secondary">
            Select groups to remove. Deleting a group releases its students so they can be assigned again.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={
                  (teamSummary.data?.teams.length ?? 0) > 0 &&
                  selectedTeamIds.length === teamSummary.data?.teams.length
                }
                indeterminate={
                  selectedTeamIds.length > 0 &&
                  selectedTeamIds.length < (teamSummary.data?.teams.length ?? 0)
                }
                onChange={(event) =>
                  setSelectedTeamIds(
                    event.target.checked
                      ? (teamSummary.data?.teams.map((team) => team.id) ?? [])
                      : [],
                  )
                }
              />
            }
            label="Select all groups"
          />
          <Box className={styles.modifyGroupList}>
            {teamSummary.data?.teams.map((team) => (
              <Box key={team.id} className={styles.modifyGroupOption}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={(event) =>
                        setSelectedTeamIds((current) =>
                          event.target.checked
                            ? [...current, team.id]
                            : current.filter((id) => id !== team.id),
                        )
                      }
                    />
                  }
                  label={`${team.name} (${team.members.length} ${team.members.length === 1 ? "student" : "students"})`}
                />
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => {
                    setDraftMemberIds(team.members.map((member) => member.userId));
                    updateMembers.reset();
                    setEditingTeamId(team.id);
                  }}
                >
                  Edit members
                </Button>
              </Box>
            ))}
          </Box>
          {deleteGroups.error && <Alert severity="error">{deleteGroups.error.message}</Alert>}
        </DialogContent>
        <DialogActions className={styles.modifyDialogActions}>
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setDeleteScope("all")}
          >
            Delete all groups
          </Button>
          <Box className={styles.dialogActionSpacer} />
          <Button onClick={() => setModifyGroupsOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={selectedTeamIds.length === 0}
            onClick={() => setDeleteScope("selected")}
          >
            Delete selected ({selectedTeamIds.length})
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editingTeamId !== null}
        onClose={() => !updateMembers.isPending && setEditingTeamId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {editingTeam?.name ?? "group"} members
        </DialogTitle>
        <DialogContent className={styles.groupDialogContent}>
          <Typography color="text.secondary">
            Current members and ungrouped students are shown. Students assigned to other groups are unavailable.
          </Typography>
          <Box className={styles.studentMemberList}>
            {teamSummary.data?.users
              .filter(
                (user) =>
                  user.role === "student" && !unavailableStudentIds.has(user.id),
              )
              .map((student) => (
                <FormControlLabel
                  key={student.id}
                  className={styles.studentMemberOption}
                  control={
                    <Checkbox
                      checked={draftMemberIds.includes(student.id)}
                      onChange={(event) =>
                        setDraftMemberIds((current) =>
                          event.target.checked
                            ? [...current, student.id]
                            : current.filter((id) => id !== student.id),
                        )
                      }
                    />
                  }
                  label={`${student.name} (${student.email})`}
                />
              ))}
          </Box>
          <Typography color="text.secondary" className={styles.selectedMemberCount}>
            {draftMemberIds.length} {draftMemberIds.length === 1 ? "student" : "students"} selected
          </Typography>
          {updateMembers.error && <Alert severity="error">{updateMembers.error.message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTeamId(null)} disabled={updateMembers.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={updateMembers.isPending || editingTeamId === null}
            onClick={() => {
              if (editingTeamId) {
                updateMembers.mutate({ teamId: editingTeamId, userIds: draftMemberIds });
              }
            }}
          >
            {updateMembers.isPending ? "Saving…" : "Save members"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteScope !== null}
        onClose={() => !deleteGroups.isPending && setDeleteScope(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm group deletion</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteScope === "all"
              ? `Delete all ${teamSummary.data?.teamCount ?? 0} groups?`
              : `Delete the ${selectedTeamIds.length} selected ${selectedTeamIds.length === 1 ? "group" : "groups"}?`}
          </Typography>
          <Typography color="text.secondary" className={styles.deleteWarningText}>
            The students will not be deleted. Their group memberships will be removed so they can be reassigned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteScope(null)} disabled={deleteGroups.isPending}>
            Keep groups
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteGroups.isPending}
            onClick={() => {
              if (deleteScope === "all") {
                deleteGroups.mutate({ scope: "all" });
              } else {
                deleteGroups.mutate({ scope: "selected", teamIds: selectedTeamIds });
              }
            }}
          >
            {deleteGroups.isPending ? "Deleting…" : "Delete groups"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={groupDialogOpen}
        onClose={() => !createGroups.isPending && setGroupDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create student groups</DialogTitle>
        <DialogContent className={styles.groupDialogContent}>
          <Typography color="text.secondary">
            Students will be assigned randomly. Existing team memberships will not be changed.
          </Typography>
          <Typography className={styles.groupSummary}>
            {teamSummary.isLoading
              ? "Checking students…"
              : `${teamSummary.data?.ungroupedStudentCount ?? 0} of ${teamSummary.data?.studentCount ?? 0} students are ungrouped.`}
          </Typography>
          <TextField
            label="Students per group"
            type="number"
            value={groupSize}
            onChange={(event) => setGroupSize(Number(event.target.value))}
            slotProps={{ htmlInput: { min: 2, max: 20 } }}
            fullWidth
          />
          {createGroups.error && (
            <Alert severity="error">{createGroups.error.message}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setGroupDialogOpen(false)}
            disabled={createGroups.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              createGroups.isPending ||
              teamSummary.data?.teamsAvailable === false ||
              groupSize < 2 ||
              groupSize > 20 ||
              (teamSummary.data?.ungroupedStudentCount ?? 0) === 0
            }
            onClick={() => createGroups.mutate({ groupSize, namePrefix: "Group" })}
          >
            {createGroups.isPending ? "Creating…" : "Create groups"}
          </Button>
        </DialogActions>
      </Dialog>

      {editingUser ? (
        <AdminEditUserDialog
          key={editingUser.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={(message) => {
            setUserActionResult(message);
            void teamSummary.refetch();
          }}
        />
      ) : null}
      <AdminDeleteUserDialog
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onDeleted={(message) => {
          setUserActionResult(message);
          void teamSummary.refetch();
        }}
      />
    </Box>
  );
}
