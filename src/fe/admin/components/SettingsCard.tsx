import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

import styles from "@/fe/admin/styles/SettingsCard.module.css";

interface SettingsCardProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
  children: ReactNode;
}

export default function SettingsCard({ icon: Icon, title, description, children }: SettingsCardProps) {
  return (
    <Box className={styles.card}>
      <Box className={styles.cardHeader}>
        <Box className={styles.cardTitleRow}>
          <Icon className={styles.cardIcon} />
          <Typography className={styles.cardTitle}>{title}</Typography>
        </Box>
        <Typography className={styles.cardDescription}>{description}</Typography>
      </Box>

      <Box className={styles.rows}>{children}</Box>
    </Box>
  );
}
