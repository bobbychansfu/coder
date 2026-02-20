"use client";

import LightbulbOutlineRoundedIcon from "@mui/icons-material/LightbulbOutlineRounded";
import { Box, Typography } from "@mui/material";
import type { BarItem } from "@mui/x-charts/BarChart";
import { BarChart } from "@mui/x-charts/BarChart";
import type {
  EngagementMetricCard,
  HintDepthDistributionItem,
  TimingDistributionItem,
} from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface BehaviorAnalysisCardProps {
  title: string;
  description: string;
  timingTitle: string;
  depthTitle: string;
  engagementTitle: string;
  timingRows: TimingDistributionItem[];
  depthRows: HintDepthDistributionItem[];
  engagementRows: EngagementMetricCard[];
}

export default function BehaviorAnalysisCard({
  title,
  description,
  timingTitle,
  depthTitle,
  engagementTitle,
  timingRows,
  depthRows,
  engagementRows,
}: BehaviorAnalysisCardProps) {
  const timingLabels = timingRows.map((row) => row.label);
  const timingValues = timingRows.map((row) => Number.parseFloat(row.value) || 0);
  const regularTimingValues = timingRows.map((row, index) => (row.danger ? null : timingValues[index]));
  const riskTimingValues = timingRows.map((row, index) => (row.danger ? timingValues[index] : null));
  const timingMax = timingValues.reduce((currentMax, value) => Math.max(currentMax, value), 0);
  const timingAxisMax = Math.max(10, Math.ceil(timingMax / 5) * 5);

  return (
    <Box className={styles.card}>
      <Box className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <LightbulbOutlineRoundedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.behaviorGrid}>
          <Box className={styles.behaviorColumn}>
            <Typography className={styles.behaviorHeading}>{timingTitle}</Typography>
            <Box className={styles.behaviorTimingChartWrap}>
              <BarChart
                layout="horizontal"
                yAxis={[
                  {
                    scaleType: "band",
                    data: timingLabels,
                    width: 150,
                  },
                ]}
                xAxis={[
                  {
                    min: 0,
                    max: timingAxisMax,
                    valueFormatter: (value: number) => `${value}%`,
                  },
                ]}
                series={[
                  {
                    data: regularTimingValues,
                    color: "#4f67ff",
                    barLabel: (item: BarItem) => (item.value == null ? null : `${item.value}%`),
                    barLabelPlacement: "outside",
                  },
                  {
                    data: riskTimingValues,
                    color: "#d4183d",
                    barLabel: (item: BarItem) => (item.value == null ? null : `${item.value}%`),
                    barLabelPlacement: "outside",
                  },
                ]}
                grid={{ vertical: true }}
                margin={{ top: 8, right: 42, bottom: 24, left: 0 }}
                height={288}
              />
            </Box>
          </Box>

          <Box className={styles.behaviorColumn}>
            <Typography className={styles.behaviorHeading}>{depthTitle}</Typography>
            <Box className={styles.depthCards}>
              {depthRows.map((row) => (
                <Box
                  key={row.label}
                  className={
                    row.tone === "early"
                      ? styles.depthCardEarly
                      : row.tone === "mid"
                        ? styles.depthCardMid
                        : styles.depthCardLate
                  }
                >
                  <Box className={styles.depthHeader}>
                    <Typography className={styles.depthLabel}>{row.label}</Typography>
                    <Typography
                      className={
                        row.tone === "early"
                          ? styles.depthValueEarly
                          : row.tone === "mid"
                            ? styles.depthValueMid
                            : styles.depthValueLate
                      }
                    >
                      {row.value}%
                    </Typography>
                  </Box>
                  <Box
                    className={
                      row.tone === "early"
                        ? styles.depthTrackEarly
                        : row.tone === "mid"
                          ? styles.depthTrackMid
                          : styles.depthTrackLate
                    }
                  >
                    <Box
                      className={
                        row.tone === "early"
                          ? styles.depthFillEarly
                          : row.tone === "mid"
                            ? styles.depthFillMid
                            : styles.depthFillLate
                      }
                      style={{ width: `${row.value}%` }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className={styles.behaviorColumn}>
            <Typography className={styles.behaviorHeading}>{engagementTitle}</Typography>
            <Box className={styles.engagementCards}>
              {engagementRows.map((row) => (
                <Box
                  key={row.label}
                  className={
                    row.tone === "warning" ? styles.engagementCardWarning : styles.engagementCard
                  }
                >
                  <Typography
                    className={
                      row.tone === "warning" ? styles.engagementLabelWarning : styles.engagementLabel
                    }
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    className={
                      row.tone === "warning" ? styles.engagementValueWarning : styles.engagementValue
                    }
                  >
                    {row.value}
                  </Typography>
                  <Typography
                    className={
                      row.tone === "warning"
                        ? styles.engagementCaptionWarning
                        : styles.engagementCaption
                    }
                  >
                    {row.caption}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
