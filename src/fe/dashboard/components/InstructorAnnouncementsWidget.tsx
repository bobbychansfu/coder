"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import DashboardWidget from "@/fe/dashboard/components/DashboardWidget";
import ActivityFeedItem from "@/fe/shared/components/ActivityFeedItem";
import type { ActivityItemData } from "@/fe/shared/types/common";
import styles from "@/fe/dashboard/styles/InstructorAnnouncementsWidget.module.css";

const activityIconMap = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
};

interface InstructorAnnouncementsWidgetProps {
  announcements: ActivityItemData[];
}

export default function InstructorAnnouncementsWidget({
  announcements,
}: InstructorAnnouncementsWidgetProps) {
  return (
    <DashboardWidget title="Announcement">
      <div className={styles.activityList}>
        {announcements.length === 0 && (
          <div className={styles.emptyState}>No announcements recorded yet.</div>
        )}
        {announcements.map((item) => (
          <ActivityFeedItem
            key={item.id}
            description={item.description}
            timestamp={item.timestamp}
            icon={activityIconMap[item.tone]}
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
