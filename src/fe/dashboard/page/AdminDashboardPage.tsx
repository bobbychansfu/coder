"use client";

import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import AdminContestOverviewSection from "@/fe/dashboard/components/AdminContestOverviewSection";
import AdminActivityWidget from "@/fe/dashboard/components/AdminActivityWidget";
import AdminHealthSnapshotWidget from "@/fe/dashboard/components/AdminHealthSnapshotWidget";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  EMPTY_ADMIN_DASHBOARD_DATA,
  useAdminDashboard,
} from "@/fe/dashboard/services/adminDashboard";
import styles from "@/fe/dashboard/styles/AdminDashboardPage.module.css";

export default function AdminDashboardPage() {
  const { data, isError } = useAdminDashboard();
  const resolvedData = data ?? EMPTY_ADMIN_DASHBOARD_DATA;

  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        <div className={styles.mainContent}>
          {isError && (
            <div className={styles.errorBanner}>
              Unable to load admin dashboard data right now.
            </div>
          )}

          <StatisticsSection
            className={styles.sectionBlock}
            gridClassName={styles.statsGrid}
            stats={resolvedData.statistics}
          />

          <AdminContestOverviewSection contests={resolvedData.contests} />
        </div>

        <aside className={styles.sidebar}>
          <UpcomingContests
            title="Platform Schedule"
            contests={resolvedData.schedule}
            emptyMessage="No platform contests are scheduled right now."
          />

          <AdminActivityWidget activity={resolvedData.activity} />

          <AdminHealthSnapshotWidget snapshots={resolvedData.snapshots} />
        </aside>
      </div>
    </>
  );
}
