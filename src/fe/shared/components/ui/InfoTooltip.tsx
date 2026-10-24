import type { ReactNode } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { IconButton, Tooltip } from "@mui/material";
import styles from "@/fe/shared/styles/InfoTooltip.module.css";

interface InfoTooltipProps {
  title: ReactNode;
  // Names the field the bubble explains, for screen readers
  ariaLabel: string;
}

// A small (i) next to a field label that explains it on hover, focus or tap
export default function InfoTooltip({ title, ariaLabel }: InfoTooltipProps) {
  return (
    <Tooltip
      title={title}
      describeChild
      arrow
      placement="top"
      enterTouchDelay={0}
      leaveTouchDelay={6000}
    >
      <IconButton size="small" className={styles.button} aria-label={ariaLabel}>
        <InfoOutlinedIcon className={styles.icon} />
      </IconButton>
    </Tooltip>
  );
}
