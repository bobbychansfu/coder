import Link from "next/link";
import { Box, Chip, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import styles from "./ProblemCard.module.css";

export interface ProblemCardProps {
  variant?: "row" | "tile";
  size?: "compact" | "tall";
  code?: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  solvedBy?: number;
  points: number;
  solved?: boolean;
  href?: string;
}

export default function ProblemCard({
  variant = "row",
  size = "compact",
  code,
  title,
  difficulty,
  tags = [],
  timeComplexity,
  spaceComplexity,
  solvedBy,
  points,
  solved,
  href,
}: ProblemCardProps) {
  // Tile Variant
  if (variant === "tile") {
    const tileDifficultyClass =
      difficulty === "easy"
        ? styles.tileBadgeEasy
        : difficulty === "medium"
          ? styles.tileBadgeMedium
          : styles.tileBadgeHard;

    const content = (
      <div
        className={`${styles.cardTile} ${
          size === "tall" ? styles.cardTall : styles.cardCompact
        }`}
      >
        <div className={styles.tileHeader}>
          <div className={styles.tileTitle}>{title}</div>
          {solved ? <EmojiEventsOutlinedIcon className={styles.tileSolved} /> : null}
        </div>
        <div className={styles.tileMeta}>
          <span className={`${styles.tileBadge} ${tileDifficultyClass}`}>
            {difficulty}
          </span>
          <span className={styles.tilePoints}>{points} points</span>
        </div>
      </div>
    );

    return href ? (
      <Link href={href} className={styles.problemLink}>
        {content}
      </Link>
    ) : (
      content
    );
  }

  // Row Variant (Default)
  const rowDifficultyClass =
    difficulty === "easy"
      ? styles.diffEasy
      : difficulty === "medium"
        ? styles.diffMedium
        : styles.diffHard;

  const content = (
    <Box className={styles.cardRow}>
      <Box className={styles.problemRow}>
        <Box className={styles.problemLeft}>
          {code && <Box className={styles.problemCode}>{code}</Box>}
          <Box flex={1}>
            <Box className={styles.problemTitleRow}>
              {solved ? (
                <Box className={styles.solvedBadge}>
                  <EmojiEventsIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                </Box>
              ) : null}
              <Typography className={styles.problemTitle}>{title}</Typography>
              <Chip
                className={`${styles.difficultyChip} ${rowDifficultyClass}`}
                label={difficulty}
                size="small"
                variant="outlined"
                sx={{ textTransform: "lowercase" }}
              />
            </Box>
            <Box className={styles.problemTitleRow}>
              {tags.map((tag) => (
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
              {timeComplexity && (
                <Box className={styles.metaItem}>
                  <AccessTimeOutlinedIcon fontSize="inherit" />
                  <span>Time: {timeComplexity}</span>
                </Box>
              )}
              {spaceComplexity && (
                <Box className={styles.metaItem}>
                  <MemoryOutlinedIcon fontSize="inherit" />
                  <span>Space: {spaceComplexity}</span>
                </Box>
              )}
              {solvedBy !== undefined && (
                <Box className={styles.metaItem}>
                  <EmojiEventsIcon fontSize="inherit" />
                  <span>Solved by {solvedBy}</span>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Box className={styles.pointsBlock}>
          <span className={styles.pointsValue}>{points}</span>
          <span className={styles.pointsLabel}>points</span>
        </Box>
      </Box>
    </Box>
  );

  return href ? (
    <Link href={href} className={styles.problemLink}>
      {content}
    </Link>
  ) : (
    content
  );
}