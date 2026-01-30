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
  const difficultyColors = {
    Easy: { bg: "transparent", color: "#00A63E", border: "#00A63E" },
    Medium: { bg: "transparent", color: "#FF8C00", border: "#FF8C00" },
    Hard: { bg: "transparent", color: "#E03E3E", border: "#E03E3E" },
  };

  const colorStyle = difficultyColors[difficulty];

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
              className={styles.difficultyBadge}
              style={{
                backgroundColor: colorStyle.bg,
                color: colorStyle.color,
                border: `1px solid ${colorStyle.border}`,
              }}
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
