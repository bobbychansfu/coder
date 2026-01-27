"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import styles from "../styles/PracticeCard.module.css";
import type { PracticeDifficulty } from "../data/practiceProblems";

interface PracticeCardProps {
  title: string;
  difficulty: PracticeDifficulty;
  points: number;
  solved?: boolean;
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
}: PracticeCardProps) {
  return (
    <div className={styles.card}>
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
