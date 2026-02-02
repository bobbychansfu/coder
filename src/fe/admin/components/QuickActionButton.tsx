"use client";

import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import type { AdminQuickAction } from "../data";
import styles from "../styles/AdminPage.module.css";

const iconMap = {
  user: PersonAddOutlinedIcon,
  settings: SettingsOutlinedIcon,
  backup: StorageOutlinedIcon,
} as const;

interface QuickActionButtonProps {
  action: AdminQuickAction;
}

export default function QuickActionButton({ action }: QuickActionButtonProps) {
  const Icon = iconMap[action.tone];

  return (
    <button className={styles.quickActionButton} type="button">
      <Icon className={styles.quickActionIcon} fontSize="inherit" />
      {action.label}
    </button>
  );
}
