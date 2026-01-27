"use client";

import StatisticsCard from "./StatisticsCard";
import { mockStatistics } from "@/fe/dashboard/data";
import styles from "../styles/StatisticsSection.module.css";

export default function StatisticsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {mockStatistics.map((stat, index) => (
          <StatisticsCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            subtitleColor={stat.subtitleColor}
          />
        ))}
      </div>
    </section>
  );
}
