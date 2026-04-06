"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TableViewRoundedIcon from "@mui/icons-material/TableViewRounded";
import { Box, Button } from "@mui/material";
import InstructorAnalysisContestMetricsCard from "@/fe/instructor/components/InstructorAnalysisContestMetricsCard";
import InstructorAnalysisExportActions from "@/fe/instructor/components/InstructorAnalysisExportActions";
import InstructorAnalysisProblemMetricsCard from "@/fe/instructor/components/InstructorAnalysisProblemMetricsCard";
import InstructorAnalysisSnapshotCard from "@/fe/instructor/components/InstructorAnalysisSnapshotCard";
import SectionFiltersBar, {
  type SectionFilterField,
} from "@/fe/instructor/components/SectionFiltersBar";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  EMPTY_INSTRUCTOR_ANALYSIS_DATA,
  EMPTY_PROBLEM_OPTION_VALUE,
} from "@/fe/instructor/services/instructorAnalysis.constants";
import { useInstructorAnalysis } from "@/fe/instructor/services/instructorAnalysis";
import type { SnapshotPreference } from "@/lib/trpc/types/instructorAnalysis";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

export default function ResearchAnalyticsPage() {
  const router = useRouter();
  const [contestId, setContestId] = useState<string | undefined>(undefined);
  const [problemId, setProblemId] = useState<string | undefined>(undefined);
  const [snapshotPreference, setSnapshotPreference] =
    useState<SnapshotPreference>("latest");

  const { data, isLoading, isFetching, isError, refetch } = useInstructorAnalysis({
    contestId,
    problemId,
    snapshotPreference,
  });
  const resolved = data ?? EMPTY_INSTRUCTOR_ANALYSIS_DATA;
  const selectedContestValue = contestId ?? resolved.selection.contestId ?? "";
  const selectedProblemValue =
    problemId ??
    resolved.selection.problemId ??
    (resolved.filters.problems.length > 0
      ? resolved.filters.problems[0].value
      : EMPTY_PROBLEM_OPTION_VALUE);

  const problemOptions = useMemo(() => {
    if (resolved.filters.problems.length > 0) {
      return resolved.filters.problems;
    }

    return [{ value: EMPTY_PROBLEM_OPTION_VALUE, label: "No problems available" }];
  }, [resolved.filters.problems]);

  const filterFields: SectionFilterField[] = [
    {
      id: "analysis-contest",
      label: "Contest",
      value: selectedContestValue,
      options:
        resolved.filters.contests.length > 0
          ? resolved.filters.contests
          : [{ value: "", label: "No contests available" }],
      onChange: (value) => {
        setContestId(value || undefined);
        setProblemId(undefined);
      },
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "analysis-problem",
      label: "Problem",
      value: selectedProblemValue,
      options: problemOptions,
      onChange: (value) => {
        setProblemId(value === EMPTY_PROBLEM_OPTION_VALUE ? undefined : value);
      },
      icon: <TableViewRoundedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "analysis-snapshot",
      label: "Snapshot",
      value: snapshotPreference,
      options: resolved.filters.snapshotPreferences,
      onChange: (value) => setSnapshotPreference(value as SnapshotPreference),
      icon: <AccessTimeRoundedIcon className={styles.sectionFilterIcon} />,
    },
  ];

  return (
    <>
      <ScrollbarHider />
      <Box className={styles.page}>
        <Box className={styles.content}>
          <PageHeader
            onBack={() => router.push(ROUTES.instructor)}
            backLabel="Back to Instructor"
            backButtonClassName={subpageStyles.backButton}
          />

          <Box className={styles.heroBlock}>
            <SubpageHeader
              title="Matrices Dashboard"
              subtitle="Post-contest instructor analytics built around preliminary (+5m) and final (+15m) snapshot windows."
              actions={
                <Box className={styles.toolbarActions}>
                  <InstructorAnalysisExportActions
                    data={resolved}
                    disabled={isLoading || isFetching || resolved.contest.title === null}
                  />
                  <Button
                    className={styles.refreshButton}
                    variant="outlined"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={() => void refetch()}
                    disabled={isFetching}
                  >
                    {isFetching ? "Refreshing..." : "Refresh Snapshot"}
                  </Button>
                </Box>
              }
            />
          </Box>

          {isError ? (
            <Box className={styles.errorBanner}>
              Unable to load instructor analysis right now. Please retry once the metrics pipeline is available.
            </Box>
          ) : null}

          <Box className={styles.sectionBlock}>
            <SectionFiltersBar fields={filterFields} />
          </Box>

          <Box className={styles.sectionBlock}>
            <InstructorAnalysisSnapshotCard
              contestTitle={
                resolved.contest.title ??
                (isLoading ? "Loading contest..." : "No instructor contests available")
              }
              contestDateLabel={resolved.contest.dateLabel}
              contestStatusLabel={resolved.contest.statusLabel}
              snapshot={resolved.snapshot}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <InstructorAnalysisContestMetricsCard rows={resolved.contestGroupMetrics} />
          </Box>

          <Box className={styles.sectionBlock}>
            <InstructorAnalysisProblemMetricsCard rows={resolved.problemStudentMetrics} />
          </Box>
        </Box>
      </Box>
    </>
  );
}
