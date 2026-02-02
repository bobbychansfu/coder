"use client";

import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import type { AdminOverviewStat } from "../data";
import styles from "../styles/AdminPage.module.css";

const iconMap = {
  users: PeopleOutlineIcon,
  contests: EmojiEventsOutlinedIcon,
  problems: StorageOutlinedIcon,
  health: MonitorHeartOutlinedIcon,
} as const;

interface AdminOverviewCardProps {
  stat: AdminOverviewStat;
}

export default function AdminOverviewCard({ stat }: AdminOverviewCardProps) {
  const Icon = iconMap[stat.tone];
  const valueClass =
    stat.valueAccent === "positive" ? styles.overviewValuePositive : "";
  const captionClass =
    stat.captionAccent === "positive" ? styles.overviewCaptionPositive : "";

  return (
    <div className={styles.overviewCard}>
      <div className={styles.overviewHeader}>
        <p className={styles.overviewLabel}>{stat.label}</p>
        <Icon className={styles.overviewIcon} fontSize="inherit" />
      </div>
      <div className={styles.overviewContent}>
        <p className={`${styles.overviewValue} ${valueClass}`.trim()}>
          {stat.value}
        </p>
        <p className={`${styles.overviewCaption} ${captionClass}`.trim()}>
          {stat.caption}
        </p>
      </div>
    </div>
  );
}
