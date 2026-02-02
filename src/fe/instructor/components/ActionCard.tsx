"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import type { InstructorAction } from "../data";
import styles from "../styles/InstructorToolsPage.module.css";

const iconMap = {
  success: NotificationsNoneOutlinedIcon,
  info: BarChartOutlinedIcon,
  purple: CreateOutlinedIcon,
  warning: EmojiEventsOutlinedIcon,
} as const;

const toneClassMap = {
  success: styles.actionIconSuccess,
  info: styles.actionIconInfo,
  purple: styles.actionIconPurple,
  warning: styles.actionIconWarning,
} as const;

interface ActionCardProps {
  action: InstructorAction;
}

export default function ActionCard({ action }: ActionCardProps) {
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
