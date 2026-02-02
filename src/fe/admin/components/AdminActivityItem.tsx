"use client";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import type { AdminActivityItem } from "../data";
import styles from "../styles/AdminPage.module.css";

const iconMap = {
  danger: PersonOutlineIcon,
  warning: MenuBookOutlinedIcon,
  info: SettingsOutlinedIcon,
  success: StorageOutlinedIcon,
} as const;

const toneClassMap = {
  danger: styles.activityIconDanger,
  warning: styles.activityIconWarning,
  info: styles.activityIconInfo,
  success: styles.activityIconSuccess,
} as const;

interface AdminActivityItemProps {
  item: AdminActivityItem;
}

export default function AdminActivityItem({ item }: AdminActivityItemProps) {
  const Icon = iconMap[item.tone];

  return (
    <div className={styles.activityItem}>
      <div className={`${styles.activityIcon} ${toneClassMap[item.tone]}`}>
        <Icon className={styles.activityIconGlyph} fontSize="inherit" />
      </div>
      <div className={styles.activityText}>
        <p className={styles.activityDescription}>{item.description}</p>
        <p className={styles.activityTimestamp}>{item.timestamp}</p>
      </div>
    </div>
  );
}
