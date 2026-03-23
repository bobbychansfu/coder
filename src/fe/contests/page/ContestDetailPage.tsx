"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import TabSwitcher from "@/fe/shared/components/ui/TabSwitcher";
import ContestDataHub from "@/fe/contests/components/ContestDataHub";
import ProblemsTab from "@/fe/contests/components/ProblemsTab";
import ScoreboardTab from "@/fe/contests/components/ScoreboardTab";
import { CONTEST_STATUS_CONFIG } from "@/fe/shared/constants/options";
import type { ContestDetail } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ContestDetailPageProps {
  contest: ContestDetail;
}

export default function ContestDetailPage({ contest }: ContestDetailPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("problems");
  const problemColumns = contest.problems.map((problem) => problem.code);

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
      />

      <Box className={styles.content}>
        <ContestDataHub contest={contest} />

        <TabSwitcher
          value={tab}
          onChange={setTab}
          options={[
            { value: "problems", label: "Problems" },
            { value: "scoreboard", label: "Scoreboard" },
          ]}
          ariaLabel="Contest detail tabs"
        />

        {tab === "problems" ? (
          <ProblemsTab contestId={contest.id} problems={contest.problems} />
        ) : (
          <ScoreboardTab rows={contest.scoreboard} problemColumns={problemColumns} />
        )}
      </Box>
    </Box>
  );
}
