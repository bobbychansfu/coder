"use client";

import { ReactNode } from "react";
import styles from "../styles/ResourceCard.module.css";

export type ResourceCardBadgeColor = "green" | "orange" | "red" | "default";
export type ResourceCardSize = "compact" | "tall";

interface ResourceCardProps {
  title: string;
  titleIcon?: ReactNode;
  badgeLabel: string;
  badgeColor?: ResourceCardBadgeColor;
  subLabel?: string; // e.g. "20 points" or "Upcoming"
  size?: ResourceCardSize;
}

const badgeColorMap: Record<ResourceCardBadgeColor, string> = {
  green: styles.badgeGreen,
  orange: styles.badgeOrange,
  red: styles.badgeRed,
  default: styles.badgeDefault,
};

export default function ResourceCard({
  title,
  titleIcon,
  badgeLabel,
  badgeColor = "default",
  subLabel,
  size = "compact",
}: ResourceCardProps) {
  return (
    <div
      className={`${styles.card} ${
        size === "tall" ? styles.cardTall : styles.cardCompact
      }`}
    >
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {titleIcon && <div className={styles.titleIcon}>{titleIcon}</div>}
      </div>
      <div className={styles.meta}>
        <span className={`${styles.badge} ${badgeColorMap[badgeColor]}`}>
          {badgeLabel}
        </span>
        {subLabel && <span className={styles.subMeta}>{subLabel}</span>}
      </div>
    </div>
  );
}
