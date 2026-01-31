"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { Box, Paper, Typography } from "@mui/material";
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
    <Paper className={styles.card} elevation={0}>
      {/* Rank Badge */}
      <Box className={styles.rankBadge}>
        <Box className={styles.rankNumber}>#{rank}</Box>
        <Typography className={styles.rankLabel}>Rank</Typography>
      </Box>

      {/* Header */}
      <Box className={styles.header}>
        <Box className={styles.iconWrapper}>
          <EmojiEventsIcon className={styles.icon} />
        </Box>
        <Box className={styles.headerContent}>
          <Box className={styles.titleRow}>
            <Typography className={styles.title}>{title}</Typography>
            <Box
              component="span"
              className={`${styles.difficultyBadge} ${styles[`difficulty${difficulty}`]}`}
            >
              {difficulty}
            </Box>
          </Box>
          <Box className={styles.metadata}>
            <Box className={styles.metadataItem}>
              <CalendarTodayIcon className={styles.metadataIcon} />
              <Typography component="span" className={styles.metadataText}>{date}</Typography>
            </Box>
            <Box className={styles.metadataItem}>
              <PeopleOutlineIcon className={styles.metadataIcon} />
              <Typography component="span" className={styles.metadataText}>
                {participants} participants
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Box className={styles.stats}>
        <Box className={styles.stat}>
          <Typography className={styles.statLabel}>Problems Solved</Typography>
          <Typography className={styles.statValue}>{problemsSolved}</Typography>
        </Box>
        <Box className={styles.stat}>
          <Typography className={styles.statLabel}>Score</Typography>
          <Typography className={styles.statValue}>{score}</Typography>
        </Box>
        <Box className={styles.stat}>
          <Typography className={styles.statLabel}>Time Taken</Typography>
          <Typography className={styles.statValue}>{timeTaken}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
