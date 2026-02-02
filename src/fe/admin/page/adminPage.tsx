"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

import { ScrollbarHider, ToolCard, StatCard, ActivityFeedItem } from "@/fe/shared";
import {
  adminActions,
  adminOverviewStats,
  adminQuickActions,
  adminRecentActivity,
  type AdminActionTone,
  type AdminOverviewTone,
  type AdminActivityTone,
} from "@/fe/admin/data";
import QuickActionButton from "@/fe/admin/components/QuickActionButton";
import { StatisticsSection } from "@/fe/dashboard/components";
import styles from "@/fe/admin/styles/AdminPage.module.css";

// Icon mappings for admin action cards
const actionIconMap: Record<AdminActionTone, SvgIconComponent> = {
  success: NotificationsNoneOutlinedIcon,
  danger: PeopleOutlineIcon,
  warning: MenuBookOutlinedIcon,
  info: SettingsOutlinedIcon,
};

// Icon mappings for admin overview cards
const overviewIconMap: Record<AdminOverviewTone, SvgIconComponent> = {
  users: PeopleOutlineIcon,
  contests: EmojiEventsOutlinedIcon,
  problems: StorageOutlinedIcon,
  health: MonitorHeartOutlinedIcon,
};

// Icon mappings for admin activity items
const activityIconMap: Record<AdminActivityTone, SvgIconComponent> = {
  danger: PersonOutlineIcon,
  warning: MenuBookOutlinedIcon,
  info: SettingsOutlinedIcon,
  success: StorageOutlinedIcon,
};

export default function AdminPage() {
  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <AdminPanelSettingsOutlinedIcon
              className={styles.headerIcon}
              fontSize="inherit"
            />
            <h1 className={styles.title}>System Administration</h1>
          </div>
          <p className={styles.subtitle}>
            Manage platform-wide settings, users, and system configuration
          </p>
        </header>

        <StatisticsSection
          className={styles.toolHubSection}
          gridClassName={styles.actionFlex}
        >
          {adminActions.map((action) => (
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
        </StatisticsSection>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>System Overview</h2>
          <div className={styles.overviewGrid}>
            {adminOverviewStats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                caption={stat.caption}
                icon={overviewIconMap[stat.tone]}
                tone={stat.tone}
                valueAccent={stat.valueAccent}
                captionAccent={stat.captionAccent}
                className={styles.overviewCard}
                headerClassName={styles.overviewHeader}
                labelClassName={styles.overviewLabel}
                iconClassName={styles.overviewIcon}
                contentClassName={styles.overviewContent}
                valueClassName={styles.overviewValue}
                captionClassName={styles.overviewCaption}
                valueAccentClassName={styles.overviewValuePositive}
                captionAccentClassName={styles.overviewCaptionPositive}
              />
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Recent System Activity</h2>
          <div className={styles.activityList}>
            {adminRecentActivity.map((item) => (
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

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActions}>
            {adminQuickActions.map((action) => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
