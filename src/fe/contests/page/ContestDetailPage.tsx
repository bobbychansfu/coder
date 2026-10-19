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
import SubmissionsTab, { type ContestSubmissionRow } from "@/fe/contests/components/SubmissionsTab";
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
  // Registered, so on a team; others may only be upsolving an ended contest
  isParticipant?: boolean;
  canEditContest?: boolean;
  // Loaded only while the Submissions tab is open
  submissions?: ContestSubmissionRow[];
}

export default function ContestDetailPage({
  contest,
  isStudent = false,
  isParticipant = false,
  canEditContest = false,
  submissions = [],
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
          isStudent && isParticipant ? (
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
        ) : tab === "submissions" ? (
          <SubmissionsTab
            contestId={contest.id}
            problems={contest.problems}
            submissions={submissions}
          />
        ) : (
          <ScoreboardTab
            contestId={contest.id}
            rows={contest.scoreboard}
            problemColumns={problemColumns}
            scoringRule={contest.scoringRule}
          />
        )}
      </Box>
    </Box>
  );
}
