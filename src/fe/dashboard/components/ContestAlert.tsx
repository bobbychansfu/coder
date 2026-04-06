"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import styles from "../styles/ContestAlert.module.css";

interface ContestAlertProps {
  title: string;
  description: string;
  onJoin?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
}

export default function ContestAlert({
  title,
  description,
  onJoin,
  actionLabel = "Join Now",
  actionDisabled = false,
}: ContestAlertProps) {
  return (
    <div className={styles.alert}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <EmojiEventsOutlinedIcon className={styles.icon} />
        </div>
        <div className={styles.textContent}>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </div>
      </div>
      <button className={styles.button} onClick={onJoin} disabled={actionDisabled}>
        {actionLabel}
        <ArrowForwardIcon className={styles.arrowIcon} />
      </button>
    </div>
  );
}
