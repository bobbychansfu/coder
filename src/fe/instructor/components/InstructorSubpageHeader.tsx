import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import styles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";

interface InstructorSubpageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export default function InstructorSubpageHeader({
  title,
  subtitle,
  actions,
}: InstructorSubpageHeaderProps) {
  return (
    <Box className={styles.headerRow}>
      <Box className={styles.headerCopy}>
        <Typography className={styles.title}>{title}</Typography>
        <Typography className={styles.subtitle}>{subtitle}</Typography>
      </Box>
      {actions ? <Box className={styles.actions}>{actions}</Box> : null}
    </Box>
  );
}
