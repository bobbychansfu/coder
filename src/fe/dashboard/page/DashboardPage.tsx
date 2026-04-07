"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
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
import type { UpcomingContest } from "@/fe/shared/types/contest";
import styles from "../styles/DashboardPage.module.css";

interface DashboardPageProps {
  contestSummary?: StudentDashboardContestSummary;
}

type PendingAction = "register" | "enter";

export default function DashboardPage({ contestSummary }: DashboardPageProps) {
  const router = useRouter();
  useTimedRouterRefresh(true);
  const { metadata, isLoading, isError } = useStudentDashboardMetadata();
  const resolvedMetadata = metadata ?? EMPTY_STUDENT_DASHBOARD_METADATA;
  const alert = !isLoading ? contestSummary?.alert ?? null : null;
  const [pendingContestId, setPendingContestId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingContest = useMemo(() => {
    if (!pendingContestId || !contestSummary) {
      return null;
    }

    return (
      contestSummary.recentContests.find((contest) => contest.id === pendingContestId) ??
      contestSummary.upcomingContests.find((contest) => contest.id === pendingContestId) ??
      (contestSummary.alert?.contestId === pendingContestId
        ? {
            id: contestSummary.alert.contestId,
            title: contestSummary.alert.title,
            actionLabel: contestSummary.alert.actionLabel,
          }
        : null)
    );
  }, [contestSummary, pendingContestId]);

  function openContestConfirmation(contestId: string, action: PendingAction): void {
    setPendingContestId(contestId);
    setPendingAction(action);
    setActionError(null);
  }

  function handlePastContestEntry(contestId: string): void {
    openContestConfirmation(contestId, "enter");
  }

  function handleUpcomingContestAction(contest: UpcomingContest): void {
    if (contest.actionLabel === "Registered") {
      return;
    }

    openContestConfirmation(contest.id, contest.actionLabel === "Register" ? "register" : "enter");
  }

  function closeContestConfirmation(): void {
    setPendingContestId(null);
    setPendingAction(null);
    setActionError(null);
  }

  async function confirmContestEntry(): Promise<void> {
    if (!pendingContestId || !pendingAction) {
      return;
    }

    setActionError(null);

    if (pendingAction === "register") {
      const response = await fetch(`/api/s/contest/register/${pendingContestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setActionError(payload?.error ?? "Unable to register for this contest right now.");
        return;
      }

      closeContestConfirmation();
      router.refresh();
      return;
    }

    closeContestConfirmation();
    router.push(buildContestRoute(pendingContestId));
  }

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
          {actionError ? <div className={styles.errorBanner}>{actionError}</div> : null}

          <StatisticsSection stats={resolvedMetadata.statistics} />

          {alert && (
            <ContestAlert
              title={alert.title}
              description={alert.description}
              actionLabel={alert.actionLabel}
              onJoin={() => openContestConfirmation(alert.contestId, "enter")}
            />
          )}

          <PastContests
            contests={contestSummary?.recentContests ?? []}
            onContestEntry={handlePastContestEntry}
          />
        </div>

        <div className={styles.sidebar}>
          <UpcomingContests
            contests={contestSummary?.upcomingContests ?? []}
            onContestAction={handleUpcomingContestAction}
          />
          <ThisWeek stats={resolvedMetadata.weeklyStats} />
          <RecentBadges badges={resolvedMetadata.badges} />
        </div>
      </div>

      <Dialog open={pendingContest !== null} onClose={closeContestConfirmation} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Contest Entry</DialogTitle>
        <DialogContent>
          {pendingContest
            ? pendingAction === "register"
              ? `You're about to register for ${pendingContest.title}. Please confirm before continuing.`
              : `You're about to ${
                  pendingContest.actionLabel === "Attend Contest" ? "enter" : "rejoin"
                } ${pendingContest.title}. Please confirm before continuing.`
            : "Please confirm before continuing."}
          {actionError ? <div className={styles.errorBanner}>{actionError}</div> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeContestConfirmation} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => void confirmContestEntry()} variant="contained" color="warning">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
