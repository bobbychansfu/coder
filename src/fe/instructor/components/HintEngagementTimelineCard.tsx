"use client";

import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import type { ReactNode } from "react";
import type { BarChartSeries } from "@/fe/instructor/data";
import MetricsBarChartCard from "@/fe/instructor/components/MetricsBarChartCard";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

interface HintEngagementTimelineCardProps {
  title: string;
  description: string;
  yAxisLabel: string;
  xLabels: string[];
  series: BarChartSeries[];
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
