"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import type { AdminAction } from "../data";
import styles from "../styles/AdminPage.module.css";

const iconMap = {
  success: NotificationsNoneOutlinedIcon,
  danger: PeopleOutlineIcon,
  warning: MenuBookOutlinedIcon,
  info: SettingsOutlinedIcon,
} as const;

const toneClassMap = {
  success: styles.actionIconSuccess,
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
      <div className={styles.actionHeader}>
        <h3 className={styles.actionTitle}>{action.title}</h3>
        <div className={`${styles.actionIcon} ${toneClassMap[action.tone]}`}>
          <Icon className={styles.actionIconGlyph} fontSize="inherit" />
        </div>
      </div>
      <p className={styles.actionDescription}>{action.description}</p>
    </button>
  );
}
