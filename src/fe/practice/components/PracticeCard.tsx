"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import styles from "../styles/PracticeCard.module.css";
import type {
  PracticeCardSize,
  PracticeDifficulty,
} from "../data/practiceProblems";

interface PracticeCardProps {
  title: string;
  difficulty: PracticeDifficulty;
  points: number;
  solved?: boolean;
  size?: PracticeCardSize;
}

const difficultyClass: Record<PracticeDifficulty, string> = {
  Easy: styles.badgeEasy,
  Medium: styles.badgeMedium,
  Hard: styles.badgeHard,
};

export default function PracticeCard({
  title,
  difficulty,
  points,
  solved,
  size = "compact",
}: PracticeCardProps) {
  return (
    <div
      className={`${styles.card} ${
        size === "tall" ? styles.cardTall : styles.cardCompact
      }`}
    >
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {solved ? <EmojiEventsOutlinedIcon className={styles.solved} /> : null}
      </div>
      <div className={styles.meta}>
        <span className={`${styles.badge} ${difficultyClass[difficulty]}`}>
          {difficulty}
        </span>
        <span className={styles.points}>{points} points</span>
      </div>
    </div>
  );
}
