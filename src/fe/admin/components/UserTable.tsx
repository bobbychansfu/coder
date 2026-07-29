import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useState, type MouseEvent } from "react";
import {
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { AdminUserRecord, AdminUserRole } from "@/fe/admin/data";
import styles from "@/fe/admin/styles/UserTable.module.css";

const roleChipConfig: Record<
  AdminUserRole,
  { label: string; className: string; icon: typeof SchoolOutlinedIcon }
> = {
  guest: { label: "Guest", className: styles.roleChipStudent, icon: PersonOutlineIcon },
  student: { label: "Student", className: styles.roleChipStudent, icon: SchoolOutlinedIcon },
  instructor: {
    label: "Instructor",
    className: styles.roleChipInstructor,
    icon: SupervisorAccountOutlinedIcon,
  },
  admin: { label: "Admin", className: styles.roleChipAdmin, icon: ShieldOutlinedIcon },
};

interface UserTableProps {
  users: AdminUserRecord[];
  onEditUser: (user: AdminUserRecord) => void;
  onDeleteUser: (user: AdminUserRecord) => void;
}

export default function UserTable({ users, onEditUser, onDeleteUser }: UserTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUser, setMenuUser] = useState<AdminUserRecord | null>(null);

  const openMenu = (event: MouseEvent<HTMLButtonElement>, user: AdminUserRecord) => {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  return (
    <Box className={styles.tableCard}>
      <TableContainer>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell className={styles.headCell}>User</TableCell>
              <TableCell className={styles.headCell}>Email</TableCell>
              <TableCell className={styles.headCell}>Role</TableCell>
              <TableCell className={styles.headCellCenter}>Courses</TableCell>
              <TableCell className={styles.headCell}>Last Active</TableCell>
              <TableCell className={styles.headCellRight}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((user) => {
              const roleConfig = roleChipConfig[user.role];
              const RoleIcon = roleConfig.icon;

              return (
                <TableRow key={user.id} className={styles.bodyRow}>
                  <TableCell className={styles.bodyCellName}>{user.name}</TableCell>
                  <TableCell className={styles.bodyCellMuted}>{user.email}</TableCell>
                  <TableCell className={styles.bodyCellRole}>
                    <Chip
                      icon={<RoleIcon className={styles.roleChipIcon} />}
                      label={roleConfig.label}
                      size="small"
                      className={`${styles.roleChip} ${roleConfig.className}`}
                    />
                  </TableCell>
                  <TableCell className={styles.bodyCellCenter}>{user.courses}</TableCell>
                  <TableCell className={styles.bodyCellMuted}>{user.lastActive}</TableCell>
                  <TableCell className={styles.bodyCellRight}>
                    <IconButton
                      className={styles.rowActionButton}
                      aria-label={`Actions for ${user.name}`}
                      onClick={(event) => openMenu(event, user)}
                    >
                      <MoreVertRoundedIcon className={styles.rowActionIcon} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          disabled={menuUser?.role === "guest"}
          onClick={() => {
            if (menuUser && menuUser.role !== "guest") onEditUser(menuUser);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit user
        </MenuItem>
        <MenuItem
          disabled={menuUser?.isCurrentUser}
          onClick={() => {
            if (menuUser) onDeleteUser(menuUser);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete user
        </MenuItem>
      </Menu>
    </Box>
  );
}
