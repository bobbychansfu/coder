import type { ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import chipStyles from "./ProblemCard.module.css";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemHeaderProps {
  title: string;
  difficulty: string;
  tags: string[];
  points: number;
  showPoints?: boolean;
  headerActions?: ReactNode;
}

export default function ProblemHeader({
  title,
  difficulty,
  tags,
  points,
  showPoints = true,
  headerActions,
}: ProblemHeaderProps) {
  const normalizedDifficulty = difficulty.toLowerCase();
  const difficultyLabel = `${normalizedDifficulty.charAt(0).toUpperCase()}${normalizedDifficulty.slice(1)}`;
  const difficultyClassName =
    normalizedDifficulty === "easy"
      ? chipStyles.diffEasy
      : normalizedDifficulty === "medium"
        ? chipStyles.diffMedium
        : chipStyles.diffHard;

  return (
    <Box className={`${styles.card} ${styles.problemHeaderCard}`}>
      <Box className={styles.problemHeaderLeft}>
        <Box className={styles.problemTitleRow}>
          <Box className={styles.problemIcon}>
            <EmojiEventsOutlinedIcon fontSize="small" />
          </Box>
          <Typography className={styles.problemTitle}>{title}</Typography>
        </Box>
        <Box className={styles.problemMetaRow}>
          <Chip
            className={`${chipStyles.difficultyChip} ${chipStyles.difficultyChipCompact} ${difficultyClassName}`}
            label={difficultyLabel}
            size="small"
          />
          {tags.map((tag) => (
            <Chip
              key={tag}
              className={chipStyles.tagChip}
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
      {headerActions ?? (showPoints ? (
        <Box className={styles.pointsBlock}>
          <span className={styles.pointsValue}>{points}</span>
          <span className={styles.pointsLabel}>points</span>
        </Box>
      ) : null)}
    </Box>
  );
}
