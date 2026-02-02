"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import type { OverviewStat } from "../data";
import styles from "../styles/InstructorToolsPage.module.css";

const iconMap = {
  contests: EmojiEventsOutlinedIcon,
  participants: GroupOutlinedIcon,
  problems: FactCheckOutlinedIcon,
} as const;

interface OverviewCardProps {
  stat: OverviewStat;
}

export default function OverviewCard({ stat }: OverviewCardProps) {
  const Icon = iconMap[stat.tone];

  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <p className={styles.overviewLabel}>{stat.label}</p>
        <Icon className={styles.overviewIcon} fontSize="inherit" />
      </div>
      <div className={styles.overviewContent}>
        <p className={styles.overviewValue}>{stat.value}</p>
        <p className={styles.overviewCaption}>{stat.caption}</p>
      </div>
    </div>
  );
}
