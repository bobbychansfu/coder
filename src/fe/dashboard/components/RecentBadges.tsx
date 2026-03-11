"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { Box, Typography } from "@mui/material";
import { mockBadges } from "@/fe/dashboard/data/badges";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/RecentBadges.module.css";

export default function RecentBadges() {
  return (
    <DashboardWidget title="Recent Badges" icon={EmojiEventsOutlinedIcon}>
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
    </DashboardWidget>
  );
}
