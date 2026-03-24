"use client";

import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import type { ReactNode } from "react";
import type { BarChartSeries } from "@/fe/instructor/data";
import MetricsBarChartCard from "@/fe/instructor/components/MetricsBarChartCard";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface SolveTimeDistributionCardProps {
  title: string;
  description: string;
  xLabels: string[];
  series: BarChartSeries[];
  filters?: ReactNode;
}

export default function SolveTimeDistributionCard({
  title,
  description,
  xLabels,
  series,
  filters,
}: SolveTimeDistributionCardProps) {
  return (
    <MetricsBarChartCard
      title={title}
      description={description}
      icon={<InsightsOutlinedIcon className={styles.cardIcon} />}
      xLabels={xLabels}
      series={series}
      filters={filters}
      yAxisLabel="Overall cohort metric"
    />
  );
}
