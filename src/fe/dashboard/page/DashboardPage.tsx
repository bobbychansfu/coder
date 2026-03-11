"use client";

import { useEffect, useState } from "react";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import ContestAlert from "@/fe/dashboard/components/ContestAlert";
import PastContests from "@/fe/dashboard/components/PastContests";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ThisWeek from "@/fe/dashboard/components/ThisWeek";
import RecentBadges from "@/fe/dashboard/components/RecentBadges";
import { mockContestAlert } from "@/fe/dashboard/data/contests";
import {
  EMPTY_DASHBOARD_METADATA,
  loadDashboardMetadata,
  subscribeDashboardMetadataRefresh,
  type DashboardMetadataView,
} from "@/fe/dashboard/services/dashboardMetadata";
import styles from "../styles/DashboardPage.module.css";

export default function DashboardPage() {
  const [metadata, setMetadata] = useState<DashboardMetadataView>(EMPTY_DASHBOARD_METADATA);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDashboard(): Promise<void> {
      try {
        const nextMetadata = await loadDashboardMetadata();
        if (!cancelled && nextMetadata) {
          setMetadata(nextMetadata);
        }
      } catch (error) {
        console.error("[dashboard metadata] failed to load", error);
      }
    }

    void hydrateDashboard();
    const unsubscribe = subscribeDashboardMetadataRefresh(hydrateDashboard);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Statistics Section */}
          <StatisticsSection stats={metadata.statistics} />

          {/* Contest Alert */}
          {mockContestAlert.isActive && (
            <ContestAlert
              title={mockContestAlert.title}
              description={mockContestAlert.description}
            />
          )}

          {/* Past Contests */}
          <PastContests />
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <UpcomingContests />
          <ThisWeek stats={metadata.weeklyStats} />
          <RecentBadges badges={metadata.badges} />
        </div>
      </div>
    </>
  );
}
