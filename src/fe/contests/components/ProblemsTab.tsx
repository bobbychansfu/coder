import { Box, Chip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { ContestProblem } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ProblemsTabProps {
  problems: ContestProblem[];
}

export default function ProblemsTab({ problems }: ProblemsTabProps) {
  return (
    <Box className={styles.problemList}>
      {problems.map((problem) => {
        const difficultyClass =
          problem.difficulty === "easy"
            ? styles.diffEasy
            : problem.difficulty === "medium"
              ? styles.diffMedium
              : styles.diffHard;

        return (
          <Box key={problem.code} className={styles.problemCard}>
            <Box className={styles.problemRow}>
              <Box className={styles.problemLeft}>
                <Box className={styles.problemCode}>{problem.code}</Box>
                <Box flex={1}>
                  <Box className={styles.problemTitleRow}>
                    {problem.solved ? (
                      <Box className={styles.solvedBadge}>
                        <EmojiEventsIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                      </Box>
                    ) : null}
                    <Typography className={styles.problemTitle}>{problem.title}</Typography>
                    <Chip
                      className={`${styles.difficultyChip} ${difficultyClass}`}
                      label={problem.difficulty}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: "lowercase" }}
                    />
                  </Box>
                  <Box className={styles.problemTitleRow}>
                    {problem.tags.map((tag) => (
                      <Chip
                        key={tag}
                        className={styles.tagChip}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box className={styles.metaRow}>
                    <Box className={styles.metaItem}>
                      <AccessTimeOutlinedIcon fontSize="inherit" />
                      <span>Time: {problem.timeComplexity}</span>
                    </Box>
                    <Box className={styles.metaItem}>
                      <MemoryOutlinedIcon fontSize="inherit" />
                      <span>Space: {problem.spaceComplexity}</span>
                    </Box>
                    <Box className={styles.metaItem}>
                      <EmojiEventsIcon fontSize="inherit" />
                      <span>Solved by {problem.solvedBy}</span>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box className={styles.pointsBlock}>
                <span className={styles.pointsValue}>{problem.points}</span>
                <span className={styles.pointsLabel}>points</span>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
