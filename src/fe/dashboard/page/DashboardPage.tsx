"use client";

import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import ContestAlert from "@/fe/dashboard/components/ContestAlert";
import PastContests from "@/fe/dashboard/components/PastContests";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ThisWeek from "@/fe/dashboard/components/ThisWeek";
import RecentBadges from "@/fe/dashboard/components/RecentBadges";
import { mockContestAlert } from "@/fe/dashboard/data/contests";
import styles from "../styles/DashboardPage.module.css";

export default function DashboardPage() {
  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Statistics Section */}
          <StatisticsSection />

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
          <ThisWeek />
          <RecentBadges />
        </div>
      </div>
    </>
  );
}
