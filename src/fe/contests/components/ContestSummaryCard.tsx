"use client";

import Link from "next/link";
import sharedStyles from "@/fe/shared/components/problem/ProblemCard.module.css";
import styles from "../styles/ContestSummaryCard.module.css";

interface ContestSummaryCardProps {
  title: string;
  status: string;
  href?: string;
  actionLabel: string;
  actionKind: "link" | "button";
  actionVariant?: "primary" | "secondary";
  onAction?: () => void;
  actionDisabled?: boolean;
}

export default function ContestSummaryCard({
  title,
  status,
  href,
  actionLabel,
  actionKind,
  actionVariant = "secondary",
  onAction,
  actionDisabled = false,
}: ContestSummaryCardProps) {
  const normalizedStatus = status.toLowerCase();
  const actionAriaLabel = `${actionLabel} ${title}`;
  const statusClassName = normalizedStatus.includes("progress") || normalizedStatus.includes("active")
    ? styles.statusInProgress
    : normalizedStatus.includes("closed") || normalizedStatus.includes("ended")
      ? styles.statusClosed
      : styles.statusUpcoming;
  const actionClassName = [
    styles.actionButton,
    actionVariant === "primary" ? styles.actionPrimary : styles.actionSecondary,
  ].join(" ");

  return (
    <div className={`${sharedStyles.cardTile} ${sharedStyles.cardCompact} ${styles.card}`}>
      <div className={styles.cardContent}>
        <div className={sharedStyles.tileHeader}>
          <div className={sharedStyles.tileTitle}>{title}</div>
        </div>
        <div className={`${sharedStyles.tileMeta} ${styles.meta}`}>
          <span className={`${styles.status} ${statusClassName}`}>{status}</span>
        </div>
      </div>
      <div className={styles.actionRow}>
        {actionKind === "link" && href ? (
          <Link href={href} className={actionClassName} aria-label={actionAriaLabel}>
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            className={actionClassName}
            onClick={onAction}
            disabled={actionDisabled}
            aria-label={actionAriaLabel}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
