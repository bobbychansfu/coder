"use client";

import { useMemo } from "react";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import InstructorContestsSection from "@/fe/dashboard/components/InstructorContestsSection";
import InstructorAnnouncementsWidget from "@/fe/dashboard/components/InstructorAnnouncementsWidget";
import InstructorMetricsSnapshotWidget from "@/fe/dashboard/components/InstructorMetricsSnapshotWidget";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  EMPTY_INSTRUCTOR_DASHBOARD_DATA,
  useInstructorDashboard,
} from "@/fe/dashboard/services/instructorDashboard";
import styles from "@/fe/dashboard/styles/InstructorDashboardPage.module.css";

export default function InstructorDashboardPage() {
  const { data, isError } = useInstructorDashboard();
  const resolvedMetadata = data ?? EMPTY_INSTRUCTOR_DASHBOARD_DATA;
  const upcomingContests = useMemo(
    () =>
      resolvedMetadata.schedule.map((contest) => ({
        id: contest.id,
        title: contest.title,
        date: contest.date,
        timeUntil: contest.timeUntil,
        readinessState: contest.readinessState,
      })),
    [resolvedMetadata.schedule],
  );

  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        <div className={styles.mainContent}>
          {isError && (
            <div className={styles.errorBanner}>
              Unable to load instructor dashboard data right now.
            </div>
          )}

          <StatisticsSection
            className={styles.sectionBlock}
            gridClassName={styles.statsGrid}
            stats={resolvedMetadata.statistics}
          />

          <InstructorContestsSection contests={resolvedMetadata.contests} />
        </div>

        <aside className={styles.sidebar}>
          <UpcomingContests
            contests={upcomingContests}
            emptyMessage="No upcoming contests right now."
            hideCourseCode
          />

          <InstructorAnnouncementsWidget announcements={resolvedMetadata.announcements} />

          <InstructorMetricsSnapshotWidget snapshots={resolvedMetadata.snapshots} />
        </aside>
      </div>
    </>
  );
}
