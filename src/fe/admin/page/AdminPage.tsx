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
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

import ManagementLayout from "@/fe/shared/components/layout/ManagementLayout";
import type { ActivityItemData, StatCardData, ToolCardData } from "@/fe/shared/types/common";
import {
  adminActions,
  adminOverviewStats,
  adminQuickActions,
  adminRecentActivity,
  type AdminActionTone,
  type AdminOverviewTone,
  type AdminActivityTone,
  type AdminQuickActionTone,
} from "@/fe/admin/data";
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

// Icon mappings for quick action buttons
const quickActionIconMap: Record<AdminQuickActionTone, SvgIconComponent> = {
  user: PersonAddOutlinedIcon,
  settings: SettingsOutlinedIcon,
  backup: StorageOutlinedIcon,
};

export default function AdminPage() {
  // Map admin data to DashboardPage format
  const actions: ToolCardData[] = adminActions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    tone: action.tone,
    icon: actionIconMap[action.tone],
  }));

  const stats: StatCardData[] = adminOverviewStats.map((stat) => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    caption: stat.caption,
    tone: stat.tone,
    valueAccent: stat.valueAccent,
    captionAccent: stat.captionAccent,
    icon: overviewIconMap[stat.tone],
  }));

  const activity: ActivityItemData[] = adminRecentActivity.map((item) => ({
    id: item.id,
    description: item.description,
    timestamp: item.timestamp,
    tone: item.tone,
    icon: activityIconMap[item.tone],
  }));

  return (
    <ManagementLayout
      title="System Administration"
      subtitle="Manage platform-wide settings, users, and system configuration"
      headerIcon={AdminPanelSettingsOutlinedIcon}
      headerIconColor="red"
      actions={actions}
      stats={stats}
      activity={activity}
    >
      {/* Quick Actions Section */}
      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {adminQuickActions.map((action) => {
            const Icon = quickActionIconMap[action.tone];
            return (
              <button
                key={action.id}
                className={styles.quickActionButton}
                type="button"
              >
                <Icon className={styles.quickActionIcon} fontSize="inherit" />
                {action.label}
              </button>
            );
          })}
        </div>
      </section>
    </ManagementLayout>
  );
}
