"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { Box, Typography } from "@mui/material";
import type { Badge } from "@/fe/shared/types/badge";
import DashboardWidget from "./DashboardWidget";
import styles from "../styles/RecentBadges.module.css";

interface RecentBadgesProps {
  badges?: Badge[];
}

export default function RecentBadges({ badges = [] }: RecentBadgesProps) {
  const visibleBadges = badges.slice(0, 3);

  return (
    <DashboardWidget title="Recent Badges" icon={EmojiEventsOutlinedIcon}>
      {visibleBadges.length === 0 ? (
        <Typography className={styles.empty}>No badges yet. Keep going.</Typography>
      ) : (
        <Box className={styles.badges}>
          {visibleBadges.map((badge) => (
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
      )}
    </DashboardWidget>
  );
}
