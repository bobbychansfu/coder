"use client";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import type { AdminActivityItem } from "../data";
import styles from "../styles/AdminToolsPage.module.css";

const iconMap = {
  danger: PersonOutlineIcon,
  warning: SchoolOutlinedIcon,
  info: BuildOutlinedIcon,
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
        <Icon fontSize="small" />
      </div>
      <div className={styles.activityText}>
        <p className={styles.activityDescription}>{item.description}</p>
        <p className={styles.activityTimestamp}>{item.timestamp}</p>
      </div>
    </div>
  );
}
