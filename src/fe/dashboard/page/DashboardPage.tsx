"use client";

import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import ContestAlert from "@/fe/dashboard/components/ContestAlert";
import PastContests from "@/fe/dashboard/components/PastContests";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ThisWeek from "@/fe/dashboard/components/ThisWeek";
import RecentBadges from "@/fe/dashboard/components/RecentBadges";
import { mockContestAlert } from "@/fe/dashboard/data/contests";
import {
  EMPTY_STUDENT_DASHBOARD_METADATA,
  getStudentDashboardMetadata,
  useStudentDashboardMetadata,
} from "@/fe/dashboard/services/dashboardMetadata";
import styles from "../styles/DashboardPage.module.css";

export default function DashboardPage() {
  const { metadata, isLoading, isError } = useStudentDashboardMetadata();
  const resolvedMetadata = metadata
    ?? (isError ? getStudentDashboardMetadata() : EMPTY_STUDENT_DASHBOARD_METADATA);
  const showContestAlert = !isLoading && mockContestAlert.isActive;

  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Statistics Section */}
          <StatisticsSection stats={resolvedMetadata.statistics} />

          {/* Contest Alert */}
          {showContestAlert && (
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
          <ThisWeek stats={resolvedMetadata.weeklyStats} />
          <RecentBadges badges={resolvedMetadata.badges} />
        </div>
      </div>
    </>
  );
}
