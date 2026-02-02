"use client";

import styles from "../styles/ContestSummaryCard.module.css";

interface ContestCardProps {
  title: string;
  status: string;
  badge: string;
}

export default function ContestSummaryCard({ title, status, badge }: ContestCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>{title}</div>
      <div className={styles.meta}>
        <span className={styles.badge}>{badge}</span>
        <span className={styles.status}>{status}</span>
      </div>
    </div>
  );
}
