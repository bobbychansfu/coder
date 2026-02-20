"use client";

import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { ConditionDistribution, SolveSummaryStat } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface SolveTimeDistributionCardProps {
  title: string;
  description: string;
  groups: ConditionDistribution[];
  summaryStats: SolveSummaryStat[];
}

export default function SolveTimeDistributionCard({
  title,
  description,
  groups,
  summaryStats,
}: SolveTimeDistributionCardProps) {
  const earlyGroup = groups.find((group) => group.label.toLowerCase().includes("early"));
  const delayedGroup = groups.find((group) => group.label.toLowerCase().includes("delayed"));
  const intervals = earlyGroup?.bars.map((bar) => bar.label) ?? [];

  const dataset = intervals.map((interval) => ({
    interval,
    early: earlyGroup?.bars.find((bar) => bar.label === interval)?.value ?? 0,
    delayed: delayedGroup?.bars.find((bar) => bar.label === interval)?.value ?? 0,
  }));
  const maxValue = dataset.reduce(
    (currentMax, row) => Math.max(currentMax, row.early, row.delayed),
    0,
  );
  const yAxisMax = Math.max(10, Math.ceil(maxValue / 10) * 10);

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <InsightsOutlinedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.chartHeaderRow}>
          {earlyGroup && (
            <Chip
              size="small"
              label={`${earlyGroup.label} • n=${earlyGroup.sampleSize}`}
              className={styles.earlySampleChip}
            />
          )}
          {delayedGroup && (
            <Chip
              size="small"
              label={`${delayedGroup.label} • n=${delayedGroup.sampleSize}`}
              className={styles.delayedSampleChip}
            />
          )}
        </Box>

        <Box className={styles.muiChartBox}>
          <BarChart
            dataset={dataset}
            xAxis={[{ scaleType: "band", dataKey: "interval" }]}
            yAxis={[{ min: 0, max: yAxisMax }]}
            series={[
              { dataKey: "early", label: earlyGroup?.label ?? "Early", color: "#00c950" },
              { dataKey: "delayed", label: delayedGroup?.label ?? "Delayed", color: "#ad46ff" },
            ]}
            grid={{ horizontal: true }}
            margin={{ top: 16, right: 16, bottom: 30, left: 40 }}
            height={260}
          />
        </Box>

        <Box className={styles.solveSummaryRow}>
          {summaryStats.map((stat) => (
            <Box
              key={`${stat.label}-${stat.caption}`}
              className={
                stat.tone === "early"
                  ? styles.solveSummaryItem
                  : stat.tone === "delayed"
                    ? styles.solveSummaryItem
                    : styles.solveSummaryItemInfo
              }
            >
              <Typography className={stat.tone === "info" ? styles.solveSummaryLabelInfo : styles.solveSummaryLabel}>
                {stat.label}
              </Typography>
              <Typography
                className={
                  stat.tone === "early"
                    ? styles.solveSummaryValueEarly
                    : stat.tone === "delayed"
                      ? styles.solveSummaryValueDelayed
                      : styles.solveSummaryValueInfo
                }
              >
                {stat.value}
              </Typography>
              <Typography
                className={
                  stat.tone === "info" ? styles.solveSummaryCaptionInfo : styles.solveSummaryCaption
                }
              >
                {stat.caption}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
