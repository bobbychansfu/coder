"use client";

import type { WeeklyStat } from "@/fe/shared/types/weeklyStats";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/ThisWeek.module.css";

interface ThisWeekProps {
  stats?: WeeklyStat[];
}

export default function ThisWeek({ stats = [] }: ThisWeekProps) {
  return (
    <DashboardWidget title="This Week">
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span
              className={`${styles.statValue} ${stat.isPositive ? styles.statValuePositive : ""}`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
