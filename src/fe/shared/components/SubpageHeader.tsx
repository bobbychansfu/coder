import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import styles from "@/fe/shared/styles/SubpageHeader.module.css";

interface SubpageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function SubpageHeader({ title, subtitle, actions }: SubpageHeaderProps) {
  return (
    <Box className={styles.headerRow}>
      <Box className={styles.headerCopy}>
        <Typography className={styles.title}>{title}</Typography>
        {subtitle ? <Typography className={styles.subtitle}>{subtitle}</Typography> : null}
      </Box>
      {actions ? <Box className={styles.actions}>{actions}</Box> : null}
    </Box>
  );
}
