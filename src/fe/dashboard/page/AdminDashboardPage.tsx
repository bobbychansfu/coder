"use client";

import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import PracticeHistory from "@/fe/dashboard/components/PracticeHistory";
import AdminContestOverviewSection from "@/fe/dashboard/components/AdminContestOverviewSection";
import AdminActivityWidget from "@/fe/dashboard/components/AdminActivityWidget";
import AdminHealthSnapshotWidget from "@/fe/dashboard/components/AdminHealthSnapshotWidget";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  EMPTY_ADMIN_DASHBOARD_DATA,
  useAdminDashboard,
} from "@/fe/dashboard/services/adminDashboard";
import type {
  StudentDashboardPracticeHistoryItem,
  StudentDashboardPracticeProblemCatalogItem,
} from "@/fe/dashboard/services/dashboardPracticeHistory";
import styles from "@/fe/dashboard/styles/AdminDashboardPage.module.css";

interface AdminDashboardPageProps {
  practiceHistory?: StudentDashboardPracticeHistoryItem[];
  practiceProblemCatalog?: StudentDashboardPracticeProblemCatalogItem[];
  currentUserComputingId?: string;
}

export default function AdminDashboardPage({
  practiceHistory = [],
  practiceProblemCatalog = [],
  currentUserComputingId,
}: AdminDashboardPageProps) {
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

          <PracticeHistory
            problems={practiceHistory}
            problemCatalog={practiceProblemCatalog}
            currentUserComputingId={currentUserComputingId}
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
