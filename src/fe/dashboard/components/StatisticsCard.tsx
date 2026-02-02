import Image from "next/image";
import { Box, Paper, Typography } from "@mui/material";
import styles from "../styles/StatisticsCard.module.css";

interface StatisticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  variant?: "success" | "neutral";
}

export default function StatisticsCard({
  title,
  value,
  subtitle,
  icon,
  variant = "neutral",
}: StatisticsCardProps) {
  return (
    <Paper className={styles.card} elevation={0}>
      <Box className={styles.header}>
        <Typography variant="h6" component="h3" className={styles.title}>
          {title}
        </Typography>
        <Box className={styles.iconWrapper}>
          <Image
            src={icon}
            alt={title}
            width={16}
            height={16}
            className={styles.icon}
          />
        </div>
      </div>
      <div className={styles.content}>
        <p className={styles.value}>{value}</p>
        <p className={`${styles.subtitle} ${styles[variant]}`}>
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
}
