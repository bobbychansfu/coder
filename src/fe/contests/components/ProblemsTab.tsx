import { Box } from "@mui/material";
import ProblemCard from "@/fe/shared/components/problem/ProblemCard";
import type { ContestProblem } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ProblemsTabProps {
  contestId: string;
  problems: ContestProblem[];
}

export default function ProblemsTab({ contestId, problems }: ProblemsTabProps) {
  return (
    <Box className={styles.problemList}>
      {problems.map((problem) => (
        <ProblemCard
          key={problem.code}
          code={problem.code}
          title={problem.title}
          difficulty={problem.difficulty}
          tags={problem.tags}
          timeComplexity={problem.timeComplexity}
          spaceComplexity={problem.spaceComplexity}
          solvedBy={problem.solvedBy}
          points={problem.points}
          solved={problem.solved}
          href={`/contests/${contestId}/problems/${problem.code.toLowerCase()}`}
        />
      ))}
    </Box>
  );
}
