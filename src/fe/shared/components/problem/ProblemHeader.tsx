import { Box, Chip, Typography } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface ProblemHeaderProps {
  title: string;
  difficulty: string;
  tags: string[];
  points: number;
  showPoints?: boolean;
}

export default function ProblemHeader({ title, difficulty, tags, points, showPoints = true }: ProblemHeaderProps) {
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
          <Chip className={styles.difficultyChip} label={difficulty} size="small" />
          {tags.map((tag) => (
            <Chip key={tag} className={styles.tagChip} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </Box>
      {showPoints && (
        <Box className={styles.pointsBlock}>
          <span className={styles.pointsValue}>{points}</span>
          <span className={styles.pointsLabel}>points</span>
        </Box>
      )}
    </Box>
  );
}
