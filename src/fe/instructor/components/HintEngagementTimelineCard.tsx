"use client";

import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface TimelineChartSeries {
  id: string;
  label: string;
  color: string;
  data: number[];
}

interface HintEngagementTimelineCardProps {
  title: string;
  description: string;
  yAxisLabel: string;
  yAxisTicks: string[];
  xLabels: string[];
  series: TimelineChartSeries[];
  insightLabel: string;
  insightText: string;
}

export default function HintEngagementTimelineCard({
  title,
  description,
  yAxisLabel,
  yAxisTicks,
  xLabels,
  series,
  insightLabel,
  insightText,
}: HintEngagementTimelineCardProps) {
  const tickValues = yAxisTicks
    .map((tick) => Number.parseFloat(tick))
    .filter((tick) => Number.isFinite(tick));
  const maxByTick = tickValues.length > 0 ? Math.max(...tickValues) : 0;
  const maxByData = series.reduce((seriesMax, line) => {
    const lineMax = line.data.reduce((valueMax, value) => Math.max(valueMax, value), 0);
    return Math.max(seriesMax, lineMax);
  }, 0);
  const yAxisMax = Math.max(10, Math.ceil(Math.max(maxByTick, maxByData) / 10) * 10);

  return (
    <Card className={styles.card}>
      <CardContent className={styles.cardContent}>
        <Box className={styles.cardTitleRow}>
          <TimelineOutlinedIcon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>

        <Box className={styles.muiChartBox}>
          <LineChart
            xAxis={[{ scaleType: "point", data: xLabels }]}
            yAxis={[{ min: 0, max: yAxisMax, label: yAxisLabel }]}
            series={series.map((line) => ({
              data: line.data,
              label: line.label,
              color: line.color,
              showMark: false,
            }))}
            grid={{ horizontal: true }}
            margin={{ top: 16, right: 16, bottom: 30, left: 44 }}
            height={260}
          />
        </Box>

        <Box className={styles.timelineLegend}>
          {series.map((line) => (
            <Box key={line.id} className={styles.legendItem}>
              <Box className={styles.legendDotDynamic} style={{ backgroundColor: line.color }} />
              <Typography className={styles.legendText}>{line.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box className={styles.timelineInsightBox}>
          <Typography className={styles.timelineInsightTitle}>{insightLabel}</Typography>
          <Typography className={styles.timelineInsightText}>{insightText}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
