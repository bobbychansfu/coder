import Link from "next/link";
import { Box, Chip } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import type { ContestProblem } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";
import cardStyles from "@/fe/shared/components/problem/ProblemCard.module.css";

interface ProblemsTabProps {
  contestId: string;
  problems: ContestProblem[];
  // ICPC contests rank by solves and penalty, so per-problem points mean nothing there
  showPoints?: boolean;
}

const DIFFICULTY_CLASS = {
  easy: cardStyles.diffEasy,
  medium: cardStyles.diffMedium,
  hard: cardStyles.diffHard,
};

// A compact table in the style of Codeforces and Kattis: one line per problem
export default function ProblemsTab({ contestId, problems, showPoints = true }: ProblemsTabProps) {
  const showDifficulty = problems.some((problem) => problem.difficulty);
  const gridTemplateColumns = [
    "56px",
    "minmax(0, 1fr)",
    showDifficulty ? "110px" : null,
    "88px",
    showPoints ? "80px" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box className={styles.problemTable}>
      <Box className={`${styles.problemTableRow} ${styles.problemTableHeader}`} sx={{ gridTemplateColumns }}>
        <span className={styles.problemTableCenter}>#</span>
        <span>Name</span>
        {showDifficulty ? <span>Difficulty</span> : null}
        <span className={styles.problemTableCenter}>Solved</span>
        {showPoints ? <span className={styles.problemTableCenter}>Points</span> : null}
      </Box>

      {problems.map((problem) => (
        <Link
          key={problem.code}
          href={`/contests/${contestId}/problems/${problem.code.toLowerCase()}`}
          className={styles.problemTableRow}
          style={{ gridTemplateColumns }}
        >
          <span className={`${styles.problemTableCenter} ${styles.problemTableCode}`}>
            {problem.code}
          </span>
          <span className={styles.problemTableName}>
            {problem.solved ? (
              <EmojiEventsIcon sx={{ fontSize: 16, color: "#16a34a" }} aria-label="Solved" />
            ) : null}
            {problem.title}
          </span>
          {showDifficulty ? (
            <span>
              {problem.difficulty ? (
                <Chip
                  className={`${cardStyles.difficultyChip} ${cardStyles.difficultyChipCompact} ${DIFFICULTY_CLASS[problem.difficulty]}`}
                  label={`${problem.difficulty.charAt(0).toUpperCase()}${problem.difficulty.slice(1)}`}
                  size="small"
                  variant="outlined"
                />
              ) : null}
            </span>
          ) : null}
          <span className={`${styles.problemTableCenter} ${styles.problemTableSolves}`}>
            {problem.solvedBy ? (
              <>
                <PersonOutlineRoundedIcon fontSize="inherit" />×{problem.solvedBy}
              </>
            ) : null}
          </span>
          {showPoints ? <span className={styles.problemTableCenter}>{problem.points}</span> : null}
        </Link>
      ))}
    </Box>
  );
}
