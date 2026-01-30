"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import {
  adminActions,
  adminOverviewStats,
  adminQuickActions,
  adminRecentActivity,
} from "../data";
import AdminActionCard from "./AdminActionCard";
import AdminOverviewCard from "./AdminOverviewCard";
import AdminActivityItem from "./AdminActivityItem";
import QuickActionButton from "./QuickActionButton";
import styles from "../styles/AdminToolsPage.module.css";

export default function AdminToolsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <AdminPanelSettingsOutlinedIcon className={styles.headerIcon} />
          <h1 className={styles.title}>System Administration</h1>
        </div>
        <p className={styles.subtitle}>
          Manage platform-wide settings, users, and system configuration
        </p>
      </header>

      <section className={styles.actionGrid}>
        {adminActions.map((action) => (
          <AdminActionCard key={action.id} action={action} />
        ))}
      </section>

      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>System Overview</h2>
        <div className={styles.overviewGrid}>
          {adminOverviewStats.map((stat) => (
            <AdminOverviewCard key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>Recent System Activity</h2>
        <div className={styles.activityList}>
          {adminRecentActivity.map((item) => (
            <AdminActivityItem key={item.id} item={item} />
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
  );
}
