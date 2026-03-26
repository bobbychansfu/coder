"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { ReactNode } from "react";
import type { BarChartSeries } from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface MetricsBarChartCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  xLabels: string[];
  series: BarChartSeries[];
  yAxisLabel?: string;
  filters?: ReactNode;
}

export default function MetricsBarChartCard({
  title,
  description,
  icon,
  xLabels,
  series,
  yAxisLabel,
  filters,
}: MetricsBarChartCardProps) {
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
            {icon}
            <Typography className={styles.cardTitle}>{title}</Typography>
          </Box>
          {description ? (
            <Typography className={styles.cardDescription}>{description}</Typography>
          ) : null}
          {filters ? <Box className={styles.cardFiltersWrap}>{filters}</Box> : null}
        </Box>

        <Box className={styles.timelineLegend}>
          {series.map((item) => (
            <Box key={item.label} className={styles.legendItem}>
              <Box
                className={styles.legendDotDynamic}
                style={{ background: item.color }}
              />
              <Typography className={styles.legendText}>{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box className={styles.muiChartBox}>
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: xLabels,
                tickLabelStyle: {
                  fontSize: 12,
                },
              },
            ]}
            yAxis={[
              {
                min: 0,
                max: yAxisMax,
                label: yAxisLabel,
              },
            ]}
            series={series.map((item) => ({
              data: item.data,
              label: item.label,
              color: item.color,
            }))}
            grid={{ horizontal: true }}
            margin={{ top: 16, right: 16, bottom: 42, left: 48 }}
            height={300}
            hideLegend
          />
        </Box>
      </CardContent>
    </Card>
  );
}
