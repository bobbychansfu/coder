"use client";

import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import type { AdminAction } from "../data";
import styles from "../styles/AdminToolsPage.module.css";

const iconMap = {
  danger: PeopleOutlineIcon,
  warning: MenuBookOutlinedIcon,
  info: SettingsOutlinedIcon,
} as const;

const toneClassMap = {
  danger: styles.actionIconDanger,
  warning: styles.actionIconWarning,
  info: styles.actionIconInfo,
} as const;

interface AdminActionCardProps {
  action: AdminAction;
}

export default function AdminActionCard({ action }: AdminActionCardProps) {
  const Icon = iconMap[action.tone];

  return (
    <button className={styles.actionCard} type="button">
      <div className={`${styles.actionIcon} ${toneClassMap[action.tone]}`}>
        <Icon fontSize="small" />
      </div>
      <h3 className={styles.actionTitle}>{action.title}</h3>
      <p className={styles.actionDescription}>{action.description}</p>
    </button>
  );
}
