"use client";

import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import { Box, Typography } from "@mui/material";
import type { InstructorAnalysisContestGroupMetricRow } from "@/lib/types/instructorAnalysis";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface InstructorAnalysisContestMetricsCardProps {
  rows: InstructorAnalysisContestGroupMetricRow[];
}

export default function InstructorAnalysisContestMetricsCard({
  rows,
}: InstructorAnalysisContestMetricsCardProps) {
  return (
    <Box className={styles.card}>
      <Box className={styles.cardHeader}>
        <Box>
          <Typography className={styles.cardEyebrow}>Contest View</Typography>
          <Typography className={styles.cardTitle}>Contest Metrics by Group</Typography>
          <Typography className={styles.cardDescription}>
            Snapshot-backed group matrices for solve rate, solve time, and attempts.
          </Typography>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Box className={styles.emptyState}>
          <Groups2OutlinedIcon className={styles.emptyStateIcon} />
          <Typography className={styles.emptyStateTitle}>No group metrics yet</Typography>
          <Typography className={styles.emptyStateBody}>
            Once a post-contest snapshot is available, this table will show per-group contest metrics.
          </Typography>
        </Box>
      ) : (
        <Box className={styles.tableWrap}>
          <table className={styles.metricsTable}>
            <thead>
              <tr>
                <th>Group</th>
                <th>Solve Rate</th>
                <th>Mean Solve Time</th>
                <th>Median Solve Time</th>
                <th>Attempts to Solve</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.groupLabel}>
                  <td>{row.groupLabel}</td>
                  <td>{row.solveRate}</td>
                  <td>{row.meanSolveTime}</td>
                  <td>{row.medianSolveTime}</td>
                  <td>{row.attemptsToSolve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}
