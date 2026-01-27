"use client";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { mockBadges } from "@/fe/dashboard/data";
import styles from "../styles/RecentBadges.module.css";

export default function RecentBadges() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <EmojiEventsOutlinedIcon className={styles.icon} />
        <h3 className={styles.title}>Recent Badges</h3>
      </div>
      <div className={styles.badges}>
        {mockBadges.map((badge) => (
          <div key={badge.id} className={styles.badge}>
            <div
              className={styles.badgeIcon}
              style={{ backgroundColor: `${badge.color}15` }}
            >
              {badge.icon}
            </div>
            <div className={styles.badgeName}>{badge.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
