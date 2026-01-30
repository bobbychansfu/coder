"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import styles from "../styles/ContestCard.module.css";

interface ContestCardProps {
  title: string;
  date: string;
  participants: number;
  difficulty: "Easy" | "Medium" | "Hard";
  rank: number;
  problemsSolved: string;
  score: string;
  timeTaken: string;
}

export default function ContestCard({
  title,
  date,
  participants,
  difficulty,
  rank,
  problemsSolved,
  score,
  timeTaken,
}: ContestCardProps) {

  return (
    <div className={styles.card}>
      {/* Rank Badge */}
      <div className={styles.rankBadge}>
        <div className={styles.rankNumber}>#{rank}</div>
        <div className={styles.rankLabel}>Rank</div>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <EmojiEventsIcon className={styles.icon} />
        </div>
        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <div className={styles.title}>{title}</div>
            <span
              className={`${styles.difficultyBadge} ${styles[`difficulty${difficulty}`]}`}
            >
              {difficulty}
            </span>
          </div>
          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <CalendarTodayIcon className={styles.metadataIcon} />
              <span className={styles.metadataText}>{date}</span>
            </div>
            <div className={styles.metadataItem}>
              <PeopleOutlineIcon className={styles.metadataIcon} />
              <span className={styles.metadataText}>
                {participants} participants
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Problems Solved</div>
          <div className={styles.statValue}>{problemsSolved}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Score</div>
          <div className={styles.statValue}>{score}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Time Taken</div>
          <div className={styles.statValue}>{timeTaken}</div>
        </div>
      </div>
    </div>
  );
}
