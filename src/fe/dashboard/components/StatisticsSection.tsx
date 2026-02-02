"use client";

import type { ReactNode } from "react";
import type { Statistic } from "@/fe/shared/types/statistics";
import StatCard from "@/fe/shared/components/StatCard";
import { mockStatistics } from "@/fe/dashboard/data/statistics";
import styles from "../styles/StatisticsSection.module.css";
import cardStyles from "../styles/StatisticsCard.module.css";

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
            <StatCard
              key={index}
              label={stat.title}
              value={stat.value}
              caption={stat.subtitle}
              icon={stat.icon}
              captionAccent={stat.variant === "success" ? "positive" : "neutral"}
              
              // Mapping styles
              className={cardStyles.card}
              headerClassName={cardStyles.header}
              labelClassName={cardStyles.title}
              iconClassName={cardStyles.iconWrapper} // Image wrapper style
              contentClassName={cardStyles.content}
              valueClassName={cardStyles.value}
              captionClassName={cardStyles.subtitle}
              
              // Variant handling
              captionAccentClassName={cardStyles.success}
            />
          ))}
      </div>
    </section>
  );
}
