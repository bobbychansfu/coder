"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { Box, Paper, Typography } from "@mui/material";
import { mockBadges } from "@/fe/dashboard/data";
import styles from "../styles/RecentBadges.module.css";

export default function RecentBadges() {
  return (
    <Paper className={styles.container} elevation={0}>
      <Box className={styles.header}>
        <EmojiEventsOutlinedIcon className={styles.icon} />
        <Typography variant="h6" component="h3" className={styles.title}>
          Recent Badges
        </Typography>
      </Box>
      <Box className={styles.badges}>
        {mockBadges.map((badge) => (
          <Box key={badge.id} className={styles.badge}>
            <Box
              className={styles.badgeIcon}
              style={{ "--badge-color": badge.color } as React.CSSProperties}
            >
              {badge.icon}
            </Box>
            <Typography className={styles.badgeName}>{badge.name}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
