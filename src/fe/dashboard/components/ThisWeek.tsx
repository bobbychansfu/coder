"use client";

import { mockWeeklyStats } from "@/fe/dashboard/data/weeklyStats";
import type { WeeklyStat } from "@/fe/shared/types/weeklyStats";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/ThisWeek.module.css";

interface ThisWeekProps {
  stats?: WeeklyStat[];
}

export default function ThisWeek({ stats = mockWeeklyStats }: ThisWeekProps) {
  return (
    <DashboardWidget title="This Week">
      <div className={styles.stats}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.stat}>
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
