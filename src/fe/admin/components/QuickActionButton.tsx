"use client";

import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import type { AdminQuickAction } from "../data";
import styles from "../styles/AdminToolsPage.module.css";

const iconMap = {
  user: PersonAddOutlinedIcon,
  course: SchoolOutlinedIcon,
  settings: SettingsOutlinedIcon,
  backup: BackupOutlinedIcon,
} as const;

interface QuickActionButtonProps {
  action: AdminQuickAction;
}

export default function QuickActionButton({ action }: QuickActionButtonProps) {
  const Icon = iconMap[action.tone];

  return (
    <button className={styles.quickActionButton} type="button">
      <Icon className={styles.quickActionIcon} />
      {action.label}
    </button>
  );
}
