"use client";

import type { ReactNode } from "react";
import type { Statistic } from "@/fe/shared/types";
import StatisticsCard from "./StatisticsCard";
import { mockStatistics } from "@/fe/dashboard/data";
import styles from "../styles/StatisticsSection.module.css";

interface StatisticsSectionProps {
  stats?: Statistic[];
  children?: ReactNode;
  className?: string;
  gridClassName?: string;
}

export default function StatisticsSection({
  stats = mockStatistics,
  children,
  className,
  gridClassName,
}: StatisticsSectionProps) {
  const gridClass = gridClassName ?? styles.grid;

  return (
    <section className={[styles.section, className].filter(Boolean).join(" ")}>
      <div className={gridClass}>
        {children ??
          stats.map((stat, index) => (
            <StatisticsCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              variant={stat.variant}
            />
          ))}
      </div>
    </section>
  );
}
