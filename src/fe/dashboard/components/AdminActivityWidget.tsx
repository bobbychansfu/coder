"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import DashboardWidget from "@/fe/dashboard/components/DashboardWidget";
import ActivityFeedItem from "@/fe/shared/components/ActivityFeedItem";
import type { ActivityItemData } from "@/fe/shared/types/common";
import styles from "@/fe/dashboard/styles/AdminActivityWidget.module.css";

const activityIconMap = {
  success: PersonAddOutlinedIcon,
  info: UpdateOutlinedIcon,
  warning: CampaignOutlinedIcon,
};

interface AdminActivityWidgetProps {
  activity: ActivityItemData[];
}

export default function AdminActivityWidget({ activity }: AdminActivityWidgetProps) {
  return (
    <DashboardWidget title="Platform Activity">
      <div className={styles.activityList}>
        {activity.length === 0 && (
          <div className={styles.emptyState}>No recent platform activity yet.</div>
        )}
        {activity.map((item) => (
          <ActivityFeedItem
            key={item.id}
            description={item.description}
            timestamp={item.timestamp}
            icon={activityIconMap[item.tone as keyof typeof activityIconMap]}
            tone={item.tone}
            className={styles.activityItem}
            iconClassName={styles.activityIcon}
            iconGlyphClassName={styles.activityIconGlyph}
            textClassName={styles.activityText}
            descriptionClassName={styles.activityDescription}
            timestampClassName={styles.activityTimestamp}
          />
        ))}
      </div>
    </DashboardWidget>
  );
}
