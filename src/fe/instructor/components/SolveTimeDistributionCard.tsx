"use client";

import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import type { ReactNode } from "react";
import type { AnalyticsSummaryStat, BarChartSeries } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface SolveTimeDistributionCardProps {
  title: string;
  description: string;
  xLabels: string[];
  xValues: number[];
  xGroups?: Array<{
    label: string;
    start: number;
    end: number;
  }>;
  series: BarChartSeries[];
  summaryStats: AnalyticsSummaryStat[];
  filters?: ReactNode;
}

export default function SolveTimeDistributionCard({
  title,
  description,
  xLabels,
  xValues: _xValues,
  xGroups: _xGroups,
  series,
  summaryStats,
  filters,
}: SolveTimeDistributionCardProps) {
  void _xValues;
  void _xGroups;
  const maxValue = series.reduce(
    (currentMax, item) => Math.max(currentMax, ...item.data),
    0,
  );
  const yAxisMax = Math.max(10, Math.ceil(maxValue / 10) * 10);

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTopBlock}>
          <Box className={styles.cardTitleRow}>
            <InsightsOutlinedIcon className={styles.cardIcon} />
            <Typography className={styles.cardTitle}>{title}</Typography>
          </Box>
          {description ? (
            <Typography className={styles.cardDescription}>{description}</Typography>
          ) : null}
          {filters ? <Box className={styles.cardFiltersWrap}>{filters}</Box> : null}
        </Box>

        <Box className={styles.muiChartBox}>
          <LineChart
            xAxis={[
              {
                scaleType: "point",
                data: xLabels,
                tickPlacement: "middle",
                tickLabelPlacement: "middle",
              },
            ]}
            yAxis={[{ min: 0, max: yAxisMax }]}
            series={series.map((item) => ({
              data: item.data,
              label: item.label,
              color: item.color,
              showMark: false,
            }))}
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
                stat.tone === "primary"
                  ? styles.solveSummaryItem
                  : stat.tone === "secondary"
                    ? styles.solveSummaryItem
                    : styles.solveSummaryItemInfo
              }
            >
              <Typography className={stat.tone === "accent" ? styles.solveSummaryLabelInfo : styles.solveSummaryLabel}>
                {stat.label}
              </Typography>
              <Typography
                className={
                  stat.tone === "primary"
                    ? styles.solveSummaryValueEarly
                    : stat.tone === "secondary"
                      ? styles.solveSummaryValueDelayed
                      : styles.solveSummaryValueInfo
                }
              >
                {stat.value}
              </Typography>
              <Typography
                className={
                  stat.tone === "accent" ? styles.solveSummaryCaptionInfo : styles.solveSummaryCaption
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
