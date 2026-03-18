"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { Box, Button } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { mockResearchAnalyticsDataset } from "@/fe/instructor/data";
import { MOCK_INSTRUCTOR_ANALYTICS } from "@/fe/instructor/data/liveInstructorAnalytics";
import HintEngagementTimelineCard from "@/fe/instructor/components/HintEngagementTimelineCard";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import LiveInstructorAnalyticsCard from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import PolicyComparisonCard from "@/fe/instructor/components/PolicyComparisonCard";
import SectionFiltersBar from "@/fe/instructor/components/SectionFiltersBar";
import SolveTimeDistributionCard from "@/fe/instructor/components/SolveTimeDistributionCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

export default function ResearchAnalyticsPage() {
  const router = useRouter();
  const {
    copy,
    dateRangeOptions,
    conditionOptions,
    timelineAxisTicks,
    gamificationTrendsByRange,
    gamificationSummaryStatsByRange,
    aiHintTrendsByRange,
  } = mockResearchAnalyticsDataset;

  const [comparisonFilters, setComparisonFilters] = useState({
    contest: "week-3-lab",
    leftGroup: "group-a",
    rightGroup: "group-b",
  });
  const [gamificationFilters, setGamificationFilters] = useState({
    dateRange: "1m",
  });
  const [hintFilters, setHintFilters] = useState({
    dateRange: "1m",
  });
  const comparisonContestOptions = useMemo(
    () =>
      MOCK_INSTRUCTOR_ANALYTICS.contests_catalog.map((contest) => ({
        label: contest.name,
        value: contest.id,
      })),
    [],
  );

  const comparisonGroupOptions = useMemo(
    () => conditionOptions.filter((option) => option.value !== "all"),
    [conditionOptions],
  );

  const comparisonRows = useMemo(() => {
    const toSegmentKey = (value: string): "groupA" | "groupB" | "groupC" => {
      if (value === "group-a") return "groupA";
      if (value === "group-b") return "groupB";
      return "groupC";
    };

    const leftBundle =
      MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[toSegmentKey(comparisonFilters.leftGroup)];
    const rightBundle =
      MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[toSegmentKey(comparisonFilters.rightGroup)];

    if (!leftBundle || !rightBundle) {
      return [];
    }

    const leftContest = leftBundle.contest_metrics.find(
      (row) => row.contest_id === comparisonFilters.contest,
    );
    const rightContest = rightBundle.contest_metrics.find(
      (row) => row.contest_id === comparisonFilters.contest,
    );
    const leftProblems = leftBundle.problem_metrics.filter(
      (row) => row.contest_id === comparisonFilters.contest,
    );
    const rightProblems = rightBundle.problem_metrics.filter(
      (row) => row.contest_id === comparisonFilters.contest,
    );

    const average = (values: Array<number | null | undefined>): number => {
      const valid = values.filter((value): value is number => typeof value === "number");
      if (valid.length === 0) return 0;
      return valid.reduce((sum, value) => sum + value, 0) / valid.length;
    };

    const buildMetric = (
      label: string,
      left: number,
      right: number,
      format: (value: number) => string,
    ) => {
      const max = Math.max(left, right, 1);
      return {
        label,
        leftValue: format(left),
        rightValue: format(right),
        leftPercent: Math.round((left / max) * 100),
        rightPercent: Math.round((right / max) * 100),
      };
    };

    return [
      buildMetric("Solve Rate", leftContest?.solve_rate ?? 0, rightContest?.solve_rate ?? 0, (value) => `${Math.round(value)}%`),
      buildMetric("Mean Solve Time", leftContest?.mean_solve_time_minutes ?? 0, rightContest?.mean_solve_time_minutes ?? 0, (value) => `${Math.round(value)}m`),
      buildMetric("Median Solve Time", leftContest?.median_solve_time_minutes ?? 0, rightContest?.median_solve_time_minutes ?? 0, (value) => `${Math.round(value)}m`),
      buildMetric("Attempts to Solve", leftContest?.attempts_to_solve ?? 0, rightContest?.attempts_to_solve ?? 0, (value) => value.toFixed(1)),
      buildMetric("First Submission", average(leftProblems.map((row) => row.time_to_first_submission_minutes)), average(rightProblems.map((row) => row.time_to_first_submission_minutes)), (value) => `${Math.round(value)}m`),
      buildMetric("First Correct", average(leftProblems.map((row) => row.time_to_first_correct_submission_minutes)), average(rightProblems.map((row) => row.time_to_first_correct_submission_minutes)), (value) => `${Math.round(value)}m`),
      buildMetric("Post-Hint Solve", average(leftProblems.map((row) => row.post_hint_solve_probability)), average(rightProblems.map((row) => row.post_hint_solve_probability)), (value) => `${Math.round(value)}%`),
      buildMetric("Attempts Before Hint", average(leftProblems.map((row) => row.attempts_before_hint)), average(rightProblems.map((row) => row.attempts_before_hint)), (value) => value.toFixed(1)),
      buildMetric("Attempts After Hint", average(leftProblems.map((row) => row.attempts_after_hint)), average(rightProblems.map((row) => row.attempts_after_hint)), (value) => value.toFixed(1)),
      buildMetric("Solve Time After Hint", average(leftProblems.map((row) => row.time_to_solve_after_hint_minutes)), average(rightProblems.map((row) => row.time_to_solve_after_hint_minutes)), (value) => `${Math.round(value)}m`),
    ];
  }, [comparisonFilters.contest, comparisonFilters.leftGroup, comparisonFilters.rightGroup]);
  const leftGroupLabel =
    comparisonGroupOptions.find((option) => option.value === comparisonFilters.leftGroup)?.label ??
    "Group A";
  const rightGroupLabel =
    comparisonGroupOptions.find((option) => option.value === comparisonFilters.rightGroup)?.label ??
    "Group B";
  const activeGamificationTrend =
    gamificationTrendsByRange[gamificationFilters.dateRange] ?? gamificationTrendsByRange.all;
  const activeGamificationSummary =
    gamificationSummaryStatsByRange[gamificationFilters.dateRange] ??
    gamificationSummaryStatsByRange.all;
  const activeAiHintTrend =
    aiHintTrendsByRange[hintFilters.dateRange] ?? aiHintTrendsByRange.all;
  const timelineChartSeries = activeAiHintTrend.series.map((series) => ({
    id: series.label,
    label: series.label,
    color: series.color,
    data: series.data,
  }));

  return (
    <>
      <ScrollbarHider />
      <Box className={styles.page}>
        <Box className={styles.content}>
          <PageHeader
            onBack={() => router.push(ROUTES.instructor)}
            backLabel={copy.backButtonLabel}
            backButtonClassName={subpageStyles.backButton}
          />

          <Box className={styles.heroBlock}>
            <InstructorSubpageHeader
              title="Instructor Comparison Dashboard"
              subtitle=""
              actions={
                <Button
                  className={styles.exportButton}
                  startIcon={<FileDownloadOutlinedIcon />}
                  variant="outlined"
                >
                  {copy.exportDataLabel}
                </Button>
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <LiveInstructorAnalyticsCard />
          </Box>

          <Box className={styles.sectionBlock}>
            <PolicyComparisonCard
              title="Group Comparison"
              description=""
              leftLabel={leftGroupLabel}
              rightLabel={rightGroupLabel}
              rows={comparisonRows}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "comparison-contest",
                      label: "Contest",
                      value: comparisonFilters.contest,
                      options: comparisonContestOptions,
                      onChange: (value) =>
                        setComparisonFilters((prev) => ({ ...prev, contest: value })),
                      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                    {
                      id: "comparison-left-group",
                      label: "Left Group",
                      value: comparisonFilters.leftGroup,
                      options: comparisonGroupOptions,
                      onChange: (value) =>
                        setComparisonFilters((prev) => ({
                          ...prev,
                          leftGroup: value,
                          rightGroup: value === prev.rightGroup ? prev.leftGroup : prev.rightGroup,
                        })),
                      icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                    {
                      id: "comparison-right-group",
                      label: "Right Group",
                      value: comparisonFilters.rightGroup,
                      options: comparisonGroupOptions,
                      onChange: (value) =>
                        setComparisonFilters((prev) => ({
                          ...prev,
                          rightGroup: value,
                          leftGroup: value === prev.leftGroup ? prev.rightGroup : prev.leftGroup,
                        })),
                      icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <SolveTimeDistributionCard
              title="Gamification Statistics"
              description=""
              xLabels={activeGamificationTrend.xLabels}
              xValues={activeGamificationTrend.xValues}
              xGroups={activeGamificationTrend.xGroups}
              series={activeGamificationTrend.series}
              summaryStats={activeGamificationSummary}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "gamification-range",
                      label: "Time Range",
                      value: gamificationFilters.dateRange,
                      options: dateRangeOptions,
                      onChange: (value) =>
                        setGamificationFilters((prev) => ({ ...prev, dateRange: value })),
                      icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <HintEngagementTimelineCard
              title="AI Hint Statistics"
              description=""
              yAxisLabel="Overall metric value"
              yAxisTicks={timelineAxisTicks}
              xLabels={activeAiHintTrend.xLabels}
              xValues={activeAiHintTrend.xValues}
              xGroups={activeAiHintTrend.xGroups}
              series={timelineChartSeries}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "hint-range",
                      label: "Time Range",
                      value: hintFilters.dateRange,
                      options: dateRangeOptions,
                      onChange: (value) => setHintFilters((prev) => ({ ...prev, dateRange: value })),
                      icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}
