"use client";

import { mockWeeklyStats } from "@/fe/dashboard/data/weeklyStats";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/ThisWeek.module.css";

export default function ThisWeek() {
  return (
    <DashboardWidget title="This Week">
      <div className={styles.stats}>
        {mockWeeklyStats.map((stat, index) => (
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
