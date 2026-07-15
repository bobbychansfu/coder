"use client";

import { useMemo } from "react";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import PracticeHistory from "@/fe/dashboard/components/PracticeHistory";
import InstructorContestsSection from "@/fe/dashboard/components/InstructorContestsSection";
import InstructorAnnouncementsWidget from "@/fe/dashboard/components/InstructorAnnouncementsWidget";
import InstructorMetricsSnapshotWidget from "@/fe/dashboard/components/InstructorMetricsSnapshotWidget";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  EMPTY_INSTRUCTOR_DASHBOARD_DATA,
  useInstructorDashboard,
} from "@/fe/dashboard/services/instructorDashboard";
import type {
  StudentDashboardPracticeHistoryItem,
  StudentDashboardPracticeProblemCatalogItem,
} from "@/fe/dashboard/services/dashboardPracticeHistory";
import styles from "@/fe/dashboard/styles/InstructorDashboardPage.module.css";

interface InstructorDashboardPageProps {
  practiceHistory?: StudentDashboardPracticeHistoryItem[];
  practiceProblemCatalog?: StudentDashboardPracticeProblemCatalogItem[];
  currentUserComputingId?: string;
}

export default function InstructorDashboardPage({
  practiceHistory = [],
  practiceProblemCatalog = [],
  currentUserComputingId,
}: InstructorDashboardPageProps) {
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

          <PracticeHistory
            problems={practiceHistory}
            problemCatalog={practiceProblemCatalog}
            currentUserComputingId={currentUserComputingId}
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
