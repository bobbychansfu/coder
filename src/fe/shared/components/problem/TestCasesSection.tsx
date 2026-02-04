import { Box, Chip, Typography } from "@mui/material";
import type { ProblemDetail } from "@/fe/contests/data/problemDetails";
import styles from "@/fe/contests/styles/ProblemSubmissionPage.module.css";

interface TestCasesSectionProps {
  testCases: ProblemDetail["testCases"];
  hiddenCount: number;
}

export default function TestCasesSection({ testCases, hiddenCount }: TestCasesSectionProps) {
  return (
    <Box className={`${styles.card} ${styles.testCasesCard}`}>
      <Typography className={styles.testCasesTitle}>Test Cases</Typography>
      {testCases.map((testCase) => (
        <Box key={testCase.id} className={styles.testCaseItem}>
          <Box className={styles.testCaseHeader}>
            <Typography className={styles.testCaseTitle}>{testCase.id}</Typography>
            {testCase.sample ? (
              <Chip className={styles.testCaseChip} label="Sample" size="small" variant="outlined" />
            ) : null}
          </Box>
          <Box className={styles.testCaseMeta}>
            <Typography variant="caption">
              <span className={styles.testCaseLabel}>Input:</span>
              {testCase.input}
            </Typography>
            <Typography variant="caption">
              <span className={styles.testCaseLabel}>Expected:</span>
              {testCase.expected}
            </Typography>
          </Box>
        </Box>
      ))}
      <Box className={styles.hiddenCases}>+ {hiddenCount} hidden test cases</Box>
    </Box>
  );
}
