"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import PageHeader from "@/fe/shared/components/PageHeader";
import ContestDataHub from "@/fe/contests/components/ContestDataHub";
import ProblemsTab from "@/fe/contests/components/ProblemsTab";
import ScoreboardTab from "@/fe/contests/components/ScoreboardTab";
import ClarificationsTab from "@/fe/contests/components/ClarificationsTab";
import type { ContestDetail } from "@/fe/contests/data/contestDetails";
import styles from "@/fe/contests/styles/ContestDetailPage.module.css";

interface ContestDetailPageProps {
  contest: ContestDetail;
}

const statusConfig: Record<ContestDetail["status"], { label: string; background: string; color: string }> = {
  upcoming: { label: "upcoming", background: "#eceef2", color: "#030213" },
  "in progress": { label: "in progress", background: "#f97316", color: "#ffffff" },
  closed: { label: "closed", background: "#f3f4f6", color: "#4b5563" },
};

export default function ContestDetailPage({ contest }: ContestDetailPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("problems");
  const problemColumns = contest.problems.map((problem) => problem.code);

  return (
    <Box className={styles.page}>
      <PageHeader
        title={contest.title}
        status={statusConfig[contest.status]}
        onBack={() => router.back()}
      />

      <Box className={styles.content}>
        <ContestDataHub contest={contest} />

        <ToggleButtonGroup
          className={styles.switcher}
          value={tab}
          exclusive
          onChange={(_, value) => value && setTab(value)}
          aria-label="Contest detail tabs"
        >
          <ToggleButton value="problems" className={styles.switcherButton} disableRipple>
            Problems
          </ToggleButton>
          <ToggleButton value="scoreboard" className={styles.switcherButton} disableRipple>
            Scoreboard
          </ToggleButton>
          <ToggleButton value="clarifications" className={styles.switcherButton} disableRipple>
            Clarifications
          </ToggleButton>
        </ToggleButtonGroup>

        {tab === "problems" ? (
          <ProblemsTab problems={contest.problems} />
        ) : tab === "scoreboard" ? (
          <ScoreboardTab rows={contest.scoreboard} problemColumns={problemColumns} />
        ) : (
          <ClarificationsTab clarifications={contest.clarifications} />
        )}
      </Box>
    </Box>
  );
}
