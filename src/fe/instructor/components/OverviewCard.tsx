"use client";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import type { OverviewStat } from "../data";
import styles from "../styles/InstructorToolsPage.module.css";

const iconMap = {
  courses: MenuBookOutlinedIcon,
  students: GroupOutlinedIcon,
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
        <Icon className={styles.overviewIcon} />
      </div>
      <p className={styles.overviewValue}>{stat.value}</p>
      <p className={styles.overviewCaption}>{stat.caption}</p>
    </div>
  );
}
