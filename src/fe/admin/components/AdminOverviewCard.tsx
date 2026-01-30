"use client";

import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import type { AdminOverviewStat } from "../data";
import styles from "../styles/AdminToolsPage.module.css";

const iconMap = {
  users: PeopleOutlineIcon,
  courses: MenuBookOutlinedIcon,
  problems: FactCheckOutlinedIcon,
  health: MonitorHeartOutlinedIcon,
} as const;

interface AdminOverviewCardProps {
  stat: AdminOverviewStat;
}

export default function AdminOverviewCard({ stat }: AdminOverviewCardProps) {
  const Icon = iconMap[stat.tone];

  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <p className={styles.overviewLabel}>{stat.label}</p>
        <Icon className={styles.overviewIcon} />
      </div>
      <p
        className={`${styles.overviewValue} ${
          stat.accent === "positive" ? styles.overviewValuePositive : ""
        }`.trim()}
      >
        {stat.value}
      </p>
      <p
        className={`${styles.overviewCaption} ${
          stat.accent === "positive" ? styles.overviewCaptionPositive : ""
        }`.trim()}
      >
        {stat.caption}
      </p>
    </div>
  );
}
