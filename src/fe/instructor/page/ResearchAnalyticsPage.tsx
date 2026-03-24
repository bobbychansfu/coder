"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import {
  Box,
  Button,
} from "@mui/material";
import { mockResearchAnalyticsDataset } from "@/fe/instructor/data";
import {
  MOCK_INSTRUCTOR_ANALYTICS,
  type ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import ComparisonAnalyticsSection from "@/fe/instructor/components/ComparisonAnalyticsSection";
import HintEngagementTimelineCard from "@/fe/instructor/components/HintEngagementTimelineCard";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import ExportAnalysisDialog from "@/fe/instructor/components/ExportAnalysisDialog";
import LiveInstructorAnalyticsCard, {
  resolveLiveInstructorAnalyticsData,
} from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import SectionFiltersBar from "@/fe/instructor/components/SectionFiltersBar";
import SolveTimeDistributionCard from "@/fe/instructor/components/SolveTimeDistributionCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import {
  buildContestComparisonRows,
  buildExportSections,
  buildGroupComparisonRows,
  buildStudentComparisonRows,
  buildStudentOptions,
  buildCsvSection,
  EXPORT_SECTION_LABELS,
  formatNumber,
  formatPercent,
  getDefaultStudentIdForGroup,
  getOptionLabel,
  toggleAllSectionSelections,
  toggleSectionSelection,
  type ContestComparisonFilters,
  type ExportFormat,
  type ExportSectionKey,
  type GroupComparisonFilters,
  type StudentComparisonFilters,
} from "@/fe/instructor/page/researchAnalytics.helpers";
import type { SectionFilterField } from "@/fe/instructor/components/SectionFiltersBar";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

export default function ResearchAnalyticsPage() {
  const router = useRouter();
  const { copy, dateRangeOptions, conditionOptions, gamificationTrendsByRange, aiHintTrendsByRange } =
    mockResearchAnalyticsDataset;

  const contestOptions = useMemo(
    () =>
      MOCK_INSTRUCTOR_ANALYTICS.contests_catalog.map((contest) => ({
        label: contest.name,
        value: contest.id,
      })),
    [],
  );

  const groupOptions = useMemo(
    () => conditionOptions.filter((option) => option.value !== "all"),
    [conditionOptions],
  );

  const [contestComparisonFilters, setContestComparisonFilters] = useState<ContestComparisonFilters>({
    leftContest: "contest-1",
    rightContest: "contest-2",
  });
  const [groupComparisonFilters, setGroupComparisonFilters] = useState<GroupComparisonFilters>({
    leftContest: "contest-1",
    leftGroup: "group-a",
    rightContest: "contest-2",
    rightGroup: "group-b",
  });
  const [studentComparisonFilters, setStudentComparisonFilters] = useState<StudentComparisonFilters>({
    leftContest: "contest-1",
    leftGroup: "group-a",
    leftStudent: "student01",
    rightContest: "contest-8",
    rightGroup: "group-b",
    rightStudent: "student05",
  });
  const [liveViewMode, setLiveViewMode] = useState<ViewMode>("all");
  const [liveSelectedContestId, setLiveSelectedContestId] = useState("all");
  const [gamificationFilters, setGamificationFilters] = useState({
    dateRange: "1m",
  });
  const [hintFilters, setHintFilters] = useState({
    dateRange: "1m",
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [selectedExportSections, setSelectedExportSections] = useState<Record<ExportSectionKey, boolean>>({
    contestData: false,
    problemData: false,
    contestComparison: false,
    groupComparison: false,
    studentComparison: false,
    gamificationStatistics: false,
    aiHintStatistics: false,
  });

  const contestRows = MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics.all.contest_metrics;
  const liveAnalyticsData = useMemo(
    () => resolveLiveInstructorAnalyticsData(liveViewMode, liveSelectedContestId),
    [liveSelectedContestId, liveViewMode],
  );

  const contestComparisonRows = useMemo(() => {
    return buildContestComparisonRows(contestRows, contestComparisonFilters);
  }, [contestComparisonFilters, contestRows]);

  const groupComparisonRows = useMemo(() => {
    return buildGroupComparisonRows(MOCK_INSTRUCTOR_ANALYTICS, groupComparisonFilters);
  }, [groupComparisonFilters]);

  const leftStudentOptions = useMemo(() => {
    return buildStudentOptions(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters.leftGroup);
  }, [studentComparisonFilters.leftGroup]);

  const rightStudentOptions = useMemo(() => {
    return buildStudentOptions(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters.rightGroup);
  }, [studentComparisonFilters.rightGroup]);

  const studentComparisonRows = useMemo(() => {
    return buildStudentComparisonRows(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters);
  }, [studentComparisonFilters]);

  const leftContestLabel = getOptionLabel(
    contestOptions,
    contestComparisonFilters.leftContest,
    "Left Contest",
  );
  const rightContestLabel = getOptionLabel(
    contestOptions,
    contestComparisonFilters.rightContest,
    "Right Contest",
  );
  const leftGroupLabel = getOptionLabel(groupOptions, groupComparisonFilters.leftGroup, "Group A");
  const rightGroupLabel = getOptionLabel(groupOptions, groupComparisonFilters.rightGroup, "Group B");
  const leftStudentLabel = getOptionLabel(
    leftStudentOptions,
    studentComparisonFilters.leftStudent,
    "Left Student",
  );
  const rightStudentLabel = getOptionLabel(
    rightStudentOptions,
    studentComparisonFilters.rightStudent,
    "Right Student",
  );
  const leftGroupComparisonContestLabel = getOptionLabel(
    contestOptions,
    groupComparisonFilters.leftContest,
    "Left Contest",
  );
  const rightGroupComparisonContestLabel = getOptionLabel(
    contestOptions,
    groupComparisonFilters.rightContest,
    "Right Contest",
  );
  const leftStudentContestLabel = getOptionLabel(
    contestOptions,
    studentComparisonFilters.leftContest,
    "Left Contest",
  );
  const rightStudentContestLabel = getOptionLabel(
    contestOptions,
    studentComparisonFilters.rightContest,
    "Right Contest",
  );

  const activeGamificationTrend =
    gamificationTrendsByRange[gamificationFilters.dateRange] ?? gamificationTrendsByRange.all;
  const activeAiHintTrend =
    aiHintTrendsByRange[hintFilters.dateRange] ?? aiHintTrendsByRange.all;
  const contestComparisonFields: SectionFilterField[] = [
    {
      id: "contest-comparison-left",
      label: "Left Contest",
      value: contestComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) =>
        setContestComparisonFilters((prev) => ({
          ...prev,
          leftContest: value,
        })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "contest-comparison-right",
      label: "Right Contest",
      value: contestComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) =>
        setContestComparisonFilters((prev) => ({
          ...prev,
          rightContest: value,
        })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
  ];
  const groupComparisonFields: SectionFilterField[] = [
    {
      id: "group-comparison-left-contest",
      label: "Left Contest",
      value: groupComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) =>
        setGroupComparisonFilters((prev) => ({ ...prev, leftContest: value })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "group-comparison-left-group",
      label: "Left Group",
      value: groupComparisonFilters.leftGroup,
      options: groupOptions,
      onChange: (value) =>
        setGroupComparisonFilters((prev) => ({ ...prev, leftGroup: value })),
      icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "group-comparison-right-contest",
      label: "Right Contest",
      value: groupComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) =>
        setGroupComparisonFilters((prev) => ({ ...prev, rightContest: value })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "group-comparison-right-group",
      label: "Right Group",
      value: groupComparisonFilters.rightGroup,
      options: groupOptions,
      onChange: (value) =>
        setGroupComparisonFilters((prev) => ({ ...prev, rightGroup: value })),
      icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
    },
  ];
  const studentComparisonFields: SectionFilterField[] = [
    {
      id: "student-comparison-left-contest",
      label: "Left Contest",
      value: studentComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({ ...prev, leftContest: value })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "student-comparison-left-group",
      label: "Left Group",
      value: studentComparisonFilters.leftGroup,
      options: groupOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({
          ...prev,
          leftGroup: value,
          leftStudent: getDefaultStudentIdForGroup(MOCK_INSTRUCTOR_ANALYTICS, value, prev.leftStudent),
        })),
      icon: <Groups2OutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "student-comparison-left",
      label: "Left Student",
      value: studentComparisonFilters.leftStudent,
      options: leftStudentOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({ ...prev, leftStudent: value })),
      icon: <PersonOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "student-comparison-right-contest",
      label: "Right Contest",
      value: studentComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({ ...prev, rightContest: value })),
      icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "student-comparison-right-group",
      label: "Right Group",
      value: studentComparisonFilters.rightGroup,
      options: groupOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({
          ...prev,
          rightGroup: value,
          rightStudent: getDefaultStudentIdForGroup(MOCK_INSTRUCTOR_ANALYTICS, value, prev.rightStudent),
        })),
      icon: <Groups2OutlinedIcon className={styles.sectionFilterIcon} />,
    },
    {
      id: "student-comparison-right-student",
      label: "Right Student",
      value: studentComparisonFilters.rightStudent,
      options: rightStudentOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({ ...prev, rightStudent: value })),
      icon: <PersonOutlinedIcon className={styles.sectionFilterIcon} />,
    },
  ];

  const exportSections = useMemo(() => {
    return buildExportSections({
      contestRows: liveAnalyticsData.contestRows.map((row) => ({
        contest: row.contest_name,
        solveRate: formatPercent(row.solve_rate),
        meanSolveTime: `${formatNumber(row.mean_solve_time_minutes)} min`,
        medianSolveTime: `${formatNumber(row.median_solve_time_minutes)} min`,
        attemptsToSolve: formatNumber(row.attempts_to_solve),
      })),
      problemRows: liveAnalyticsData.orderedProblemRows.map((row) => ({
        contest: row.contest_name,
        problem: `${row.problem_code} - ${row.problem_title}`,
        firstSubmission: `${formatNumber(row.time_to_first_submission_minutes)} min`,
        firstCorrect: `${formatNumber(row.time_to_first_correct_submission_minutes)} min`,
        postHintSolveProbability: formatPercent(row.post_hint_solve_probability),
        attemptsBeforeHint: formatNumber(row.attempts_before_hint),
        attemptsAfterHint: formatNumber(row.attempts_after_hint),
        solveTimeAfterHint: `${formatNumber(row.time_to_solve_after_hint_minutes)} min`,
      })),
      contestComparisonRows,
      groupComparisonRows,
      studentComparisonRows,
      leftContestLabel,
      rightContestLabel,
      leftGroupComparisonContestLabel,
      rightGroupComparisonContestLabel,
      leftGroupLabel,
      rightGroupLabel,
      leftStudentContestLabel,
      rightStudentContestLabel,
      leftStudentLabel,
      rightStudentLabel,
      leftStudentGroup: studentComparisonFilters.leftGroup,
      rightStudentGroup: studentComparisonFilters.rightGroup,
      gamificationTrend: activeGamificationTrend,
      aiHintTrend: activeAiHintTrend,
    });
  }, [
    activeAiHintTrend,
    activeGamificationTrend,
    contestComparisonRows,
    groupComparisonRows,
    leftContestLabel,
    leftGroupComparisonContestLabel,
    leftGroupLabel,
    leftStudentLabel,
    leftStudentContestLabel,
    liveAnalyticsData.contestRows,
    liveAnalyticsData.orderedProblemRows,
    rightContestLabel,
    rightGroupComparisonContestLabel,
    rightGroupLabel,
    rightStudentLabel,
    rightStudentContestLabel,
    studentComparisonFilters.leftGroup,
    studentComparisonFilters.rightGroup,
    studentComparisonRows,
  ]);

  function toggleExportSection(section: ExportSectionKey): void {
    setSelectedExportSections((current) => toggleSectionSelection(current, section));
  }

  const allSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).every(
    (key) => selectedExportSections[key],
  );
  const someSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).some(
    (key) => selectedExportSections[key],
  );

  function toggleAllExportSections(): void {
    const nextValue = !allSectionsSelected;
    setSelectedExportSections(toggleAllSectionSelections(nextValue));
  }

  function downloadExport(): void {
    const selectedEntries = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).filter(
      (key) => selectedExportSections[key],
    );
    if (selectedEntries.length === 0) return;

    const fileBaseName = `instructor-analysis-export-${new Date().toISOString().slice(0, 10)}`;
    let content = "";
    let mimeType = "application/json";
    let extension = "json";

    if (exportFormat === "json") {
      const jsonPayload = selectedEntries.reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = exportSections[key];
        return acc;
      }, {});
      content = JSON.stringify(jsonPayload, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else if (exportFormat === "csv") {
      content = selectedEntries
        .map((key) => buildCsvSection(EXPORT_SECTION_LABELS[key], exportSections[key]))
        .join("\n");
      mimeType = "text/csv;charset=utf-8";
      extension = "csv";
    } else {
      content = selectedEntries
        .map((key) => {
          const rows = exportSections[key];
          const body =
            rows.length === 0
              ? "No data"
              : rows
                  .map((row) =>
                    Object.entries(row)
                      .map(([field, value]) => `- ${field}: ${String(value)}`)
                      .join("\n"),
                  )
                  .join("\n\n");
          return `<section style="margin-bottom:24px;">
  <h2 style="font-family: Arial, sans-serif; color:#b42318; margin:0 0 12px;">${EXPORT_SECTION_LABELS[key]}</h2>
  <pre style="white-space:pre-wrap; font-family: Arial, sans-serif; font-size:12px; line-height:1.5; margin:0;">${body.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>
</section>`;
        })
        .join("");
      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) return;
      printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${fileBaseName}</title>
  </head>
  <body style="padding:32px; color:#101828; background:#fff;">
    <h1 style="font-family: Arial, sans-serif; color:#7a271a; margin:0 0 24px;">Instructor Analysis Data</h1>
    ${content}
  </body>
</html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setIsExportDialogOpen(false);
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  }

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
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  {copy.exportDataLabel}
                </Button>
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <LiveInstructorAnalyticsCard
              viewMode={liveViewMode}
              selectedContestId={liveSelectedContestId}
              onViewModeChange={setLiveViewMode}
              onSelectedContestIdChange={setLiveSelectedContestId}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title="Contest Comparison"
              leftLabel={leftContestLabel}
              rightLabel={rightContestLabel}
              rows={contestComparisonRows}
              fields={contestComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title="Group Comparison"
              leftLabel={leftGroupLabel}
              rightLabel={rightGroupLabel}
              rows={groupComparisonRows}
              fields={groupComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title="Student Comparison"
              leftLabel={leftStudentLabel}
              rightLabel={rightStudentLabel}
              rows={studentComparisonRows}
              fields={studentComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <SolveTimeDistributionCard
              title="Gamification Statistics"
              description=""
              xLabels={activeGamificationTrend.xLabels}
              series={activeGamificationTrend.series}
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
              yAxisLabel="Overall cohort metric"
              xLabels={activeAiHintTrend.xLabels}
              series={activeAiHintTrend.series}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "hint-range",
                      label: "Time Range",
                      value: hintFilters.dateRange,
                      options: dateRangeOptions,
                      onChange: (value) =>
                        setHintFilters((prev) => ({ ...prev, dateRange: value })),
                      icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>
        </Box>
      </Box>

      <ExportAnalysisDialog
        open={isExportDialogOpen}
        exportFormat={exportFormat}
        selectedSections={selectedExportSections}
        allSectionsSelected={allSectionsSelected}
        someSectionsSelected={someSectionsSelected}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={downloadExport}
        onExportFormatChange={setExportFormat}
        onToggleAll={toggleAllExportSections}
        onToggleSection={toggleExportSection}
      />
    </>
  );
}
