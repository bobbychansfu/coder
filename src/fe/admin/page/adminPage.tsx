"use client";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { ScrollbarHider } from "@/fe/shared";
import {
  adminActions,
  adminOverviewStats,
  adminQuickActions,
  adminRecentActivity,
} from "@/fe/admin/data";
import AdminActionCard from "@/fe/admin/components/AdminActionCard";
import AdminOverviewCard from "@/fe/admin/components/AdminOverviewCard";
import AdminActivityItem from "@/fe/admin/components/AdminActivityItem";
import QuickActionButton from "@/fe/admin/components/QuickActionButton";
import { StatisticsSection } from "@/fe/dashboard/components";
import styles from "@/fe/admin/styles/AdminPage.module.css";

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
            <AdminActionCard key={action.id} action={action} />
          ))}
        </StatisticsSection>

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
    </>
  );
}
