"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import type { ActivityItem as ActivityItemType } from "../data";
import styles from "../styles/InstructorToolsPage.module.css";

const iconMap = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
} as const;

const toneClassMap = {
  success: styles.activityIconSuccess,
  info: styles.activityIconInfo,
  highlight: styles.activityIconHighlight,
} as const;

interface ActivityItemProps {
  item: ActivityItemType;
}

export default function ActivityItem({ item }: ActivityItemProps) {
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
