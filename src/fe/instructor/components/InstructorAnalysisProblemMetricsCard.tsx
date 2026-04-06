"use client";

import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import { Box, Typography } from "@mui/material";
import type { InstructorAnalysisProblemStudentMetricRow } from "@/lib/types/instructorAnalysis";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface InstructorAnalysisProblemMetricsCardProps {
  rows: InstructorAnalysisProblemStudentMetricRow[];
}

export default function InstructorAnalysisProblemMetricsCard({
  rows,
}: InstructorAnalysisProblemMetricsCardProps) {
  return (
    <Box className={styles.card}>
      <Box className={styles.cardHeader}>
        <Box>
          <Typography className={styles.cardEyebrow}>Problem View</Typography>
          <Typography className={styles.cardTitle}>Problem Metrics by Student</Typography>
          <Typography className={styles.cardDescription}>
            Student-level timing and hint behavior for the selected problem snapshot.
          </Typography>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Box className={styles.emptyState}>
          <TableViewRoundedIcon className={styles.emptyStateIcon} />
          <Typography className={styles.emptyStateTitle}>No student metrics yet</Typography>
          <Typography className={styles.emptyStateBody}>
            Select a problem with a computed snapshot to inspect student-level matrices.
          </Typography>
        </Box>
      ) : (
        <Box className={styles.tableWrap}>
          <table className={styles.metricsTable}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Group</th>
                <th>First Submission</th>
                <th>First Correct</th>
                <th>Post-Hint Solve Prob.</th>
                <th>Attempts Before Hint</th>
                <th>Attempts After Hint</th>
                <th>Time to Solve After Hint</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentId}>
                  <td>{row.studentName}</td>
                  <td>{row.groupLabel}</td>
                  <td>{row.timeToFirstSubmission}</td>
                  <td>{row.timeToFirstCorrect}</td>
                  <td>{row.postHintSolveProbability}</td>
                  <td>{row.attemptsBeforeHint}</td>
                  <td>{row.attemptsAfterHint}</td>
                  <td>{row.timeToSolveAfterHint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}
