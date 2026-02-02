"use client";

import Link from "next/link";
import styles from "../styles/ContestSummaryCard.module.css";

interface ContestSummaryCardProps {
  title: string;
  status: string;
  badge: string;
  href: string;
}

export default function ContestSummaryCard({
  title,
  status,
  badge,
  href,
}: ContestSummaryCardProps) {
  const statusClassName =
    status.toLowerCase().includes("progress")
      ? styles.statusInProgress
      : styles.statusClosed;

  return (
    <Link href={href} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>
          <span className={styles.badge}>{badge}</span>
          <span className={`${styles.status} ${statusClassName}`}>{status}</span>
        </div>
      </div>
    </Link>
  );
}
