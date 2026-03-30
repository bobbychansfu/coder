"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import type { ContestStatus } from "@/fe/shared/types/contest";
import styles from "../styles/ContestResultCard.module.css";

interface ContestResultCardProps {
  title: string;
  date: string;
  participants: number;
  difficulty: "Easy" | "Medium" | "Hard";
  status: ContestStatus;
  rank?: number | null;
  problemsSolved?: string;
  score?: string;
  timeTaken?: string;
}

export default function ContestResultCard({
  title,
  date,
  participants,
  difficulty,
  status,
  rank,
  problemsSolved,
  score,
  timeTaken,
}: ContestResultCardProps) {
  const statusClassName =
    status === "In Progress" ? styles.statusInProgress : styles.statusClosed;
  const statItems = [
    problemsSolved ? { label: "Problems Solved", value: problemsSolved } : null,
    score ? { label: "Score", value: score } : null,
    timeTaken ? { label: "Time Taken", value: timeTaken } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className={styles.card}>
      {typeof rank === "number" ? (
        <div className={styles.rankBadge}>
          <div className={styles.rankNumber}>#{rank}</div>
          <div className={styles.rankLabel}>Rank</div>
        </div>
      ) : null}

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
            <span className={`${styles.statusBadge} ${statusClassName}`}>
              {status}
            </span>
          </div>
          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <CalendarTodayIcon className={styles.metadataIcon} />
              <span className={styles.metadataText}>{date}</span>
            </div>
            <div className={styles.metadataItem}>
              <PeopleOutlineIcon className={styles.metadataIcon} />
              <span className={styles.metadataText}>{participants} participants</span>
            </div>
          </div>
        </div>
      </div>

      {statItems.length > 0 ? (
        <div className={styles.stats}>
          {statItems.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
