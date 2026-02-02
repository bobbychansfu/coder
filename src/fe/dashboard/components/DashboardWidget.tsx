"use client";

import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import styles from "../styles/DashboardWidget.module.css";

interface DashboardWidgetProps {
  title: string;
  icon?: SvgIconComponent;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
}

export default function DashboardWidget({
  title,
  icon: Icon,
  children,
  className,
  headerClassName,
  titleClassName,
}: DashboardWidgetProps) {
  return (
    <div className={[styles.container, className].filter(Boolean).join(" ")}>
      <div className={[styles.header, headerClassName].filter(Boolean).join(" ")}>
        {Icon && (
          <div className={styles.icon}>
            <Icon fontSize="inherit" />
          </div>
        )}
        <h3 className={[styles.title, titleClassName].filter(Boolean).join(" ")}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
