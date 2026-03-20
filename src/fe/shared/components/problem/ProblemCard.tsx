import Link from "next/link";
import { Box, Chip, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import styles from "./ProblemCard.module.css";

export interface ProblemCardProps {
  variant?: "row" | "tile";
  size?: "compact" | "tall";
  density?: "default" | "compact";
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
  density = "default",
  code,
  title,
  difficulty,
  tags = [],
  solvedBy,
  points,
  solved,
  href,
}: ProblemCardProps) {
  const difficultyLabel = `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;

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
          {solved ? <EmojiEventsIcon className={styles.tileSolved} /> : null}
        </div>
        <div className={styles.tileMeta}>
          <span className={`${styles.tileBadge} ${tileDifficultyClass}`}>
            {difficultyLabel}
          </span>
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
    <Box className={`${styles.cardRow} ${density === "compact" ? styles.cardRowCompact : ""}`}>
      <Box className={styles.problemRow}>
        <Box className={styles.problemLeft}>
          {code && (
            <Box className={`${styles.problemCode} ${density === "compact" ? styles.problemCodeCompact : ""}`}>
              {code}
            </Box>
          )}
          <Box flex={1}>
            <Box className={styles.problemTitleRow}>
              {solved ? (
                <Box className={styles.solvedBadge}>
                  <EmojiEventsIcon sx={{ fontSize: 16, color: "#16a34a" }} />
                </Box>
              ) : null}
              <Typography
                className={`${styles.problemTitle} ${density === "compact" ? styles.problemTitleCompact : ""}`}
              >
                {title}
              </Typography>
              <Chip
                className={`${styles.difficultyChip} ${rowDifficultyClass} ${
                  density === "compact" ? styles.difficultyChipCompact : ""
                }`}
                label={difficultyLabel}
                size="small"
                variant="outlined"
              />
            </Box>
            <Box className={styles.problemTitleRow}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  className={`${styles.tagChip} ${density === "compact" ? styles.tagChipCompact : ""}`}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box className={styles.metaRow}>
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
          <span className={`${styles.pointsValue} ${density === "compact" ? styles.pointsValueCompact : ""}`}>
            {points}
          </span>
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
