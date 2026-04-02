"use client";

import { useRouter } from "next/navigation";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import ContestAlert from "@/fe/dashboard/components/ContestAlert";
import PastContests from "@/fe/dashboard/components/PastContests";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ThisWeek from "@/fe/dashboard/components/ThisWeek";
import RecentBadges from "@/fe/dashboard/components/RecentBadges";
import {
  EMPTY_STUDENT_DASHBOARD_METADATA,
  useStudentDashboardMetadata,
} from "@/fe/dashboard/services/dashboardMetadata";
import type { StudentDashboardContestSummary } from "@/fe/dashboard/services/dashboardContests";
import { buildContestRoute } from "@/fe/shared/constants/routes";
import styles from "../styles/DashboardPage.module.css";

interface DashboardPageProps {
  contestSummary?: StudentDashboardContestSummary;
}

export default function DashboardPage({ contestSummary }: DashboardPageProps) {
  const router = useRouter();
  const { metadata, isLoading, isError } = useStudentDashboardMetadata();
  const resolvedMetadata = metadata ?? EMPTY_STUDENT_DASHBOARD_METADATA;
  const alert = !isLoading ? contestSummary?.alert ?? null : null;

  return (
    <>
      <ScrollbarHider />
      <div className={styles.page}>
        <div className={styles.mainContent}>
          {isError && (
            <div className={styles.errorBanner}>
              Unable to load student dashboard metadata right now.
            </div>
          )}

          <StatisticsSection stats={resolvedMetadata.statistics} />

          {alert && (
            <ContestAlert
              title={alert.title}
              description={alert.description}
              onJoin={() => router.push(buildContestRoute(alert.contestId))}
            />
          )}

          <PastContests contests={contestSummary?.recentContests ?? []} />
        </div>

        <div className={styles.sidebar}>
          <UpcomingContests contests={contestSummary?.upcomingContests ?? []} />
          <ThisWeek stats={resolvedMetadata.weeklyStats} />
          <RecentBadges badges={resolvedMetadata.badges} />
        </div>
      </div>
    </>
  );
}
