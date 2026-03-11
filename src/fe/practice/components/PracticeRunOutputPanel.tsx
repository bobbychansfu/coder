import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import type { PracticeJudgeCaseResult, PracticeJudgeResult } from "@/fe/practice/services/problemService";
import styles from "@/fe/practice/styles/PracticeRunOutputPanel.module.css";

interface PracticeRunOutputPanelProps {
  hasRun: boolean;
  isRunning: boolean;
  result: PracticeJudgeResult | null;
  hiddenCount: number;
}

export default function PracticeRunOutputPanel({
  hasRun,
  isRunning,
  result,
  hiddenCount,
}: PracticeRunOutputPanelProps) {
  if (!hasRun) {
    return null;
  }

  return (
    <Box className={styles.card}>
      <Typography className={styles.title}>Output</Typography>

      {isRunning ? (
        <Box className={styles.loadingBlock}>
          <CircularProgress size={20} />
          <Typography className={styles.loadingText}>Judging your code...</Typography>
        </Box>
      ) : null}

      {!isRunning && result ? (
        <>
          <Box className={styles.summaryRow}>
            <Chip
              label={result.verdict}
              className={`${styles.verdictChip} ${
                result.verdict === "Accepted" ? styles.verdictAccepted : styles.verdictWrong
              }`}
              size="small"
            />
            <Typography className={styles.summaryText}>{result.summary}</Typography>
          </Box>

          <Box className={styles.metaRow}>
            <Typography className={styles.metaText}>Runtime: {result.runtimeMs} ms</Typography>
            <Typography className={styles.metaText}>Memory: {result.memoryMb} MB</Typography>
          </Box>

          <Box className={styles.caseList}>
            {result.cases.map((caseItem: PracticeJudgeCaseResult) => (
              <Box key={caseItem.id} className={styles.caseCard}>
                <Box className={styles.caseHeader}>
                  <Typography className={styles.caseTitle}>{caseItem.id}</Typography>
                  <Chip
                    label={caseItem.passed ? "Passed" : "Failed"}
                    size="small"
                    className={`${styles.caseStatusChip} ${
                      caseItem.passed ? styles.casePassed : styles.caseFailed
                    }`}
                  />
                </Box>

                <Box className={styles.caseDetailList}>
                  <Typography className={styles.caseDetail}>
                    <span className={styles.caseLabel}>Input:</span>
                    {caseItem.input}
                  </Typography>
                  <Typography className={styles.caseDetail}>
                    <span className={styles.caseLabel}>Expected:</span>
                    {caseItem.expected}
                  </Typography>
                  <Typography className={styles.caseDetail}>
                    <span className={styles.caseLabel}>Output:</span>
                    {caseItem.output}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box className={styles.hiddenCases}>{hiddenCount} hidden test cases run on submit</Box>
        </>
      ) : null}
    </Box>
  );
}
