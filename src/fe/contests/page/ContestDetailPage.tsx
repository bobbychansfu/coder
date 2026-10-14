"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import {
  buildContestEditRoute,
  buildContestTabs,
  parseContestTab,
} from "@/fe/shared/constants/routes";
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
  // The tab lives in the URL so problem pages can link straight to the scoreboard
  const tab = parseContestTab(useSearchParams().get("tab"));
  const problemColumns = contest.problems.map((problem) => problem.code);

  return (
    <Box className={styles.page}>
      <PageHeader
        title={contest.title}
        status={CONTEST_STATUS_CONFIG[contest.status]}
        // Always the contest list: browser history may hold another site or nothing at all.
        onBack={() => router.push("/contests")}
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
          options={buildContestTabs(contest.id)}
          ariaLabel="Contest detail tabs"
        />

        {tab === "problems" ? (
          <ProblemsTab
            contestId={contest.id}
            problems={contest.problems}
            showPoints={contest.scoringRule !== "ICPC"}
          />
        ) : (
          <ScoreboardTab
            rows={contest.scoreboard}
            problemColumns={problemColumns}
            scoringRule={contest.scoringRule}
          />
        )}
      </Box>
    </Box>
  );
}
