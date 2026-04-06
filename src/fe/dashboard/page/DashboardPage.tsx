"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import StatisticsSection from "@/fe/dashboard/components/StatisticsSection";
import ContestAlert from "@/fe/dashboard/components/ContestAlert";
import PastContests from "@/fe/dashboard/components/PastContests";
import UpcomingContests from "@/fe/dashboard/components/UpcomingContests";
import ThisWeek from "@/fe/dashboard/components/ThisWeek";
import RecentBadges from "@/fe/dashboard/components/RecentBadges";
import { useTimedRouterRefresh } from "@/fe/shared/hooks/useTimedRouterRefresh";
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
  useTimedRouterRefresh(true);
  const { metadata, isLoading, isError } = useStudentDashboardMetadata();
  const resolvedMetadata = metadata ?? EMPTY_STUDENT_DASHBOARD_METADATA;
  const alert = !isLoading ? contestSummary?.alert ?? null : null;
  const [isJoiningContest, setIsJoiningContest] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinContest = async () => {
    if (!alert || isJoiningContest) {
      return;
    }

    setJoinError(null);

    if (!alert.requiresRegistration) {
      router.push(buildContestRoute(alert.contestId));
      return;
    }

    setIsJoiningContest(true);

    try {
      const response = await fetch(`/api/s/contest/register/${alert.contestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to join contest.");
      }

      router.push(buildContestRoute(alert.contestId));
      router.refresh();
    } catch {
      setJoinError("Unable to join the current contest right now.");
    } finally {
      setIsJoiningContest(false);
    }
  };

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

          {joinError && <div className={styles.errorBanner}>{joinError}</div>}

          <StatisticsSection stats={resolvedMetadata.statistics} />

          {alert && (
            <ContestAlert
              title={alert.title}
              description={alert.description}
              onJoin={handleJoinContest}
              actionLabel={isJoiningContest ? "Joining..." : "Join Now"}
              actionDisabled={isJoiningContest}
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
