"use client";

import { mockWeeklyStats } from "@/fe/dashboard/data";
import styles from "../styles/ThisWeek.module.css";

export default function ThisWeek() {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>This Week</h3>
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
    </div>
  );
}
