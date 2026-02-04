"use client";

import Link from "next/link";
import type { DifficultyLevel } from "@/fe/shared/types/contest";
import styles from "../styles/ContestSummaryCard.module.css";

interface ContestSummaryCardProps {
  title: string;
  status: string;
  difficulty: DifficultyLevel;
  href: string;
}

export default function ContestSummaryCard({
  title,
  status,
  difficulty,
  href,
}: ContestSummaryCardProps) {
  const normalizedStatus = status.toLowerCase();
  const statusClassName = normalizedStatus.includes("progress") || normalizedStatus.includes("active")
    ? styles.statusInProgress
    : normalizedStatus.includes("closed") || normalizedStatus.includes("ended")
      ? styles.statusClosed
      : styles.statusUpcoming;

  return (
    <Link href={href} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>
          <span className={styles.badge}>{difficulty}</span>
          <span className={`${styles.status} ${statusClassName}`}>{status}</span>
        </div>
      </div>
    </Link>
  );
}
