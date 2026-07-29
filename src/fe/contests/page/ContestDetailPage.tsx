"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import TabSwitcher from "@/fe/shared/components/ui/TabSwitcher";
import { useTimedRouterRefresh } from "@/fe/shared/hooks/useTimedRouterRefresh";
import ContestDataHub from "@/fe/contests/components/ContestDataHub";
import ProblemsTab from "@/fe/contests/components/ProblemsTab";
import ScoreboardTab from "@/fe/contests/components/ScoreboardTab";
import ContestTeamControls from "@/fe/contests/components/ContestTeamControls";
import { CONTEST_STATUS_CONFIG } from "@/fe/shared/constants/options";
import type { ContestDetail } from "@/fe/contests/data/contestDetails";
import { buildContestEditRoute } from "@/fe/shared/constants/routes";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";
import listPageStyles from "@/fe/shared/styles/ListPageLayout.module.css";

interface ContestDetailPageProps {
  contest: ContestDetail;
  isStudent?: boolean;
  canEditContest?: boolean;
}

export default function ContestDetailPage({
  contest,
  isStudent = false,
  canEditContest = false,
}: ContestDetailPageProps) {
  const router = useRouter();
  useTimedRouterRefresh(contest.status !== "closed");
  const [tab, setTab] = useState<string>("problems");
  const problemColumns = contest.problems.map((problem) => problem.code);
  const hasScoreboard = contest.scoreboard.length > 0;

  return (
    <Box className={styles.page}>
      <PageHeader
        title={contest.title}
        status={CONTEST_STATUS_CONFIG[contest.status]}
        onBack={() => router.back()}
        backButtonClassName={styles.backButton}
        headerClassName={styles.headerRow}
        titleClassName={styles.title}
        statusChipClassName={styles.statusChip}
        actions={
          isStudent ? (
            <ContestTeamControls contestId={contest.id} />
          ) : canEditContest ? (
            <Link
              className={listPageStyles.actionButton}
              href={buildContestEditRoute(contest.id)}
            >
              Edit Contest
            </Link>
          ) : undefined
        }
      />

      <Box className={styles.content}>
        <ContestDataHub contest={contest} />

        <TabSwitcher
          value={tab}
          onChange={setTab}
          options={
            hasScoreboard
              ? [
                  { value: "problems", label: "Problems" },
                  { value: "scoreboard", label: "Scoreboard" },
                ]
              : [{ value: "problems", label: "Problems" }]
          }
          ariaLabel="Contest detail tabs"
        />

        {tab === "problems" || !hasScoreboard ? (
          <ProblemsTab contestId={contest.id} problems={contest.problems} />
        ) : (
          <ScoreboardTab rows={contest.scoreboard} problemColumns={problemColumns} />
        )}
      </Box>
    </Box>
  );
}
