"use client";

import type { SvgIconComponent } from "@mui/icons-material";

import type { CompactStatTone } from "@/fe/shared/types/common";
import styles from "@/fe/shared/styles/CompactStatCard.module.css";

interface CompactStatCardProps {
  label: string;
  value: string | number;
  icon: SvgIconComponent;
  tone: CompactStatTone;
  className?: string;
}

export default function CompactStatCard({
  label,
  value,
  icon: Icon,
  tone,
  className,
}: CompactStatCardProps) {
  const cardClassName = [styles.card, className].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      <div className={styles.iconWrap} data-tone={tone}>
        <Icon className={styles.icon} />
      </div>
      <div className={styles.copy}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
}
