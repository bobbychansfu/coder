"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

import { ToolCard, StatCard, ActivityFeedItem } from "@/fe/shared";
import {
  instructorActions,
  overviewStats,
  recentActivity,
  type InstructorActionTone,
  type OverviewTone,
  type ActivityTone,
} from "@/fe/instructor/data";
import styles from "@/fe/instructor/styles/InstructorPage.module.css";

// Icon mappings for instructor action cards
const actionIconMap: Record<InstructorActionTone, SvgIconComponent> = {
  success: NotificationsNoneOutlinedIcon,
  info: BarChartOutlinedIcon,
  purple: CreateOutlinedIcon,
  warning: EmojiEventsOutlinedIcon,
};

// Icon mappings for instructor overview cards
const overviewIconMap: Record<OverviewTone, SvgIconComponent> = {
  contests: EmojiEventsOutlinedIcon,
  participants: GroupOutlinedIcon,
  problems: FactCheckOutlinedIcon,
};

// Icon mappings for instructor activity items
const activityIconMap: Record<ActivityTone, SvgIconComponent> = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
};

export default function InstructorPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Instructor Tools</h1>
        <p className={styles.subtitle}>
          Manage your courses, create problems, and track student progress
        </p>
      </header>

      <section className={styles.actionGrid}>
        {instructorActions.map((action) => (
          <ToolCard
            key={action.id}
            title={action.title}
            description={action.description}
            icon={actionIconMap[action.tone]}
            tone={action.tone}
            className={styles.actionCard}
            headerClassName={styles.actionHeader}
            titleClassName={styles.actionTitle}
            iconClassName={styles.actionIcon}
            iconGlyphClassName={styles.actionIconGlyph}
            descriptionClassName={styles.actionDescription}
          />
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>Quick Overview</h2>
        <div className={styles.overviewGrid}>
          {overviewStats.map((stat) => (
            <StatCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              caption={stat.caption}
              icon={overviewIconMap[stat.tone]}
              tone={stat.tone}
              className={styles.overviewCard}
              headerClassName={styles.overviewHeader}
              labelClassName={styles.overviewLabel}
              iconClassName={styles.overviewIcon}
              contentClassName={styles.overviewContent}
              valueClassName={styles.overviewValue}
              captionClassName={styles.overviewCaption}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {recentActivity.map((item) => (
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
      </section>
    </div>
  );
}
