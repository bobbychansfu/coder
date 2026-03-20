"use client";

import Link from "next/link";
import type { DifficultyLevel } from "@/fe/shared/types/contest";
import sharedStyles from "@/fe/shared/components/problem/ProblemCard.module.css";
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
  const normalizedDifficulty = difficulty.toLowerCase();
  const difficultyClassName =
    normalizedDifficulty === "easy"
      ? sharedStyles.tileBadgeEasy
      : normalizedDifficulty === "medium"
        ? sharedStyles.tileBadgeMedium
        : sharedStyles.tileBadgeHard;
  const normalizedStatus = status.toLowerCase();
  const statusClassName = normalizedStatus.includes("progress") || normalizedStatus.includes("active")
    ? styles.statusInProgress
    : normalizedStatus.includes("closed") || normalizedStatus.includes("ended")
      ? styles.statusClosed
      : styles.statusUpcoming;

  return (
    <Link href={href} className={styles.link}>
      <div className={`${sharedStyles.cardTile} ${sharedStyles.cardCompact} ${styles.card}`}>
        <div className={sharedStyles.tileHeader}>
          <div className={sharedStyles.tileTitle}>{title}</div>
        </div>
        <div className={`${sharedStyles.tileMeta} ${styles.meta}`}>
          <span className={`${sharedStyles.tileBadge} ${difficultyClassName}`}>{difficulty}</span>
          <span className={`${styles.status} ${statusClassName}`}>{status}</span>
        </div>
      </div>
    </Link>
  );
}
