"use client";

import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import type { ReactNode } from "react";
import MetricsBarChartCard from "@/fe/instructor/components/MetricsBarChartCard";
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
  xLabels: string[];
  series: TimelineChartSeries[];
  filters?: ReactNode;
}

export default function HintEngagementTimelineCard({
  title,
  description,
  yAxisLabel,
  xLabels,
  series,
  filters,
}: HintEngagementTimelineCardProps) {
  return (
    <MetricsBarChartCard
      title={title}
      description={description}
      icon={<TimelineOutlinedIcon className={styles.cardIcon} />}
      xLabels={xLabels}
      series={series}
      filters={filters}
      yAxisLabel={yAxisLabel}
    />
  );
}
