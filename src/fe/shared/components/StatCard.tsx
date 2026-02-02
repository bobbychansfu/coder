"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { AccentType } from "@/fe/shared/types";

interface StatCardProps {
  label: string;
  value: string;
  caption: string;
  icon: SvgIconComponent;
  tone: string;
  valueAccent?: AccentType;
  captionAccent?: AccentType;
  className?: string;
  headerClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  contentClassName?: string;
  valueClassName?: string;
  captionClassName?: string;
  valueAccentClassName?: string;
  captionAccentClassName?: string;
}

/**
 * Shared statistics/overview card component
 * Used across admin overview, instructor overview, and dashboard statistics sections
 */
export default function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  valueAccent,
  captionAccent,
  className = "",
  headerClassName = "",
  labelClassName = "",
  iconClassName = "",
  contentClassName = "",
  valueClassName = "",
  captionClassName = "",
  valueAccentClassName = "",
  captionAccentClassName = "",
}: StatCardProps) {
  const valueClasses = [
    valueClassName,
    valueAccent === "positive" ? valueAccentClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  const captionClasses = [
    captionClassName,
    captionAccent === "positive" ? captionAccentClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} data-tone={tone}>
      <div className={headerClassName}>
        <p className={labelClassName}>{label}</p>
        <Icon className={iconClassName} fontSize="inherit" />
      </div>
      <div className={contentClassName}>
        <p className={valueClasses.trim()}>{value}</p>
        <p className={captionClasses.trim()}>{caption}</p>
      </div>
    </div>
  );
}
