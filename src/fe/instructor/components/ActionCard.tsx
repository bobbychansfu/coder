"use client";

import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import type { InstructorAction } from "../data";
import styles from "../styles/InstructorToolsPage.module.css";

const iconMap = {
  primary: BarChartOutlinedIcon,
  secondary: CreateOutlinedIcon,
  accent: EmojiEventsOutlinedIcon,
} as const;

const toneClassMap = {
  primary: styles.actionIconPrimary,
  secondary: styles.actionIconSecondary,
  accent: styles.actionIconAccent,
} as const;

interface ActionCardProps {
  action: InstructorAction;
}

export default function ActionCard({ action }: ActionCardProps) {
  const Icon = iconMap[action.tone];

  return (
    <div className={styles.actionCard}>
      <div className={`${styles.actionIcon} ${toneClassMap[action.tone]}`}>
        <Icon fontSize="small" />
      </div>
      <h3 className={styles.actionTitle}>{action.title}</h3>
      <p className={styles.actionDescription}>{action.description}</p>
    </div>
  );
}
