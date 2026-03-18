"use client";

import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import { Box, Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { GroupComparisonMetricRow } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface PolicyComparisonCardProps {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  rows: GroupComparisonMetricRow[];
  filters?: ReactNode;
}

export default function PolicyComparisonCard({
  title,
  description,
  leftLabel,
  rightLabel,
  rows,
  filters,
}: PolicyComparisonCardProps) {
  return (
    <Card className={`${styles.card} ${styles.policyComparisonCard}`}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTopBlock}>
          <Box className={styles.cardTitleRow}>
            <LeaderboardOutlinedIcon className={styles.cardIcon} />
            <Typography className={styles.cardTitle}>{title}</Typography>
          </Box>
          {description ? (
            <Typography className={styles.cardDescription}>{description}</Typography>
          ) : null}
          {filters ? <Box className={styles.cardFiltersWrap}>{filters}</Box> : null}
        </Box>

        <Box className={styles.groupCompareCard}>
          <Box className={styles.groupCompareHeader}>
            <Typography className={styles.groupCompareSideLabel}>{leftLabel}</Typography>
            <Typography className={styles.groupCompareCenterLabel}>Comparison</Typography>
            <Typography className={styles.groupCompareSideLabel}>{rightLabel}</Typography>
          </Box>

          <Box className={styles.groupCompareRows}>
            {rows.map((row) => (
              <Box key={row.label} className={styles.groupCompareRow}>
                <Box className={styles.groupCompareSide}>
                  <Box className={styles.groupCompareTrack}>
                    <Box
                      className={styles.groupCompareFillLeft}
                      style={{ width: `${row.leftPercent}%` }}
                    />
                  </Box>
                  <Typography className={styles.groupCompareValue}>{row.leftValue}</Typography>
                </Box>

                <Box className={styles.groupCompareMetricCenter}>
                  <Typography className={styles.groupCompareMetricLabel}>{row.label}</Typography>
                </Box>

                <Box className={styles.groupCompareSide}>
                  <Typography className={styles.groupCompareValue}>{row.rightValue}</Typography>
                  <Box className={styles.groupCompareTrack}>
                    <Box
                      className={styles.groupCompareFillRight}
                      style={{ width: `${row.rightPercent}%` }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
