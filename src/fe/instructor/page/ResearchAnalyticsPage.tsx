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
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { mockResearchAnalyticsDataset } from "@/fe/instructor/data";
import {
  MOCK_INSTRUCTOR_ANALYTICS,
  type ProblemMetricRow,
  type ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import HintEngagementTimelineCard from "@/fe/instructor/components/HintEngagementTimelineCard";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import LiveInstructorAnalyticsCard, {
  resolveLiveInstructorAnalyticsData,
} from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import PolicyComparisonCard from "@/fe/instructor/components/PolicyComparisonCard";
import SectionFiltersBar from "@/fe/instructor/components/SectionFiltersBar";
import SolveTimeDistributionCard from "@/fe/instructor/components/SolveTimeDistributionCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

function average(values: Array<number | null | undefined>): number {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function formatMetricValue(value: number, kind: "percent" | "minutes" | "decimal"): string {
  if (kind === "percent") return `${Math.round(value)}%`;
  if (kind === "minutes") return `${Math.round(value)}m`;
  return value.toFixed(1);
}

function buildComparisonRow(
  label: string,
  left: number,
  right: number,
  kind: "percent" | "minutes" | "decimal",
) {
  const max = Math.max(left, right, 1);

  return {
    label,
    leftValue: formatMetricValue(left, kind),
    rightValue: formatMetricValue(right, kind),
    leftPercent: Math.round((left / max) * 100),
    rightPercent: Math.round((right / max) * 100),
  };
}

function buildProblemComparisonRows(
  leftProblems: ProblemMetricRow[],
  rightProblems: ProblemMetricRow[],
) {
  return [
    buildComparisonRow(
      "First Submission",
      average(leftProblems.map((row) => row.time_to_first_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "First Correct",
      average(leftProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      average(rightProblems.map((row) => row.time_to_first_correct_submission_minutes)),
      "minutes",
    ),
    buildComparisonRow(
      "Post-Hint Solve",
      average(leftProblems.map((row) => row.post_hint_solve_probability)),
      average(rightProblems.map((row) => row.post_hint_solve_probability)),
      "percent",
    ),
    buildComparisonRow(
      "Attempts Before Hint",
      average(leftProblems.map((row) => row.attempts_before_hint)),
      average(rightProblems.map((row) => row.attempts_before_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Attempts After Hint",
      average(leftProblems.map((row) => row.attempts_after_hint)),
      average(rightProblems.map((row) => row.attempts_after_hint)),
      "decimal",
    ),
    buildComparisonRow(
      "Solve Time After Hint",
      average(leftProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      average(rightProblems.map((row) => row.time_to_solve_after_hint_minutes)),
      "minutes",
    ),
  ];
}

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}`;
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value}%`;
}

const EXPORT_SECTION_LABELS = {
  contestData: "Contest Data",
  problemData: "Problem Data",
  contestComparison: "Contest Comparison",
  groupComparison: "Group Comparison",
  studentComparison: "Student Comparison",
  gamificationStatistics: "Gamification Statistics",
  aiHintStatistics: "AI Hint Statistics",
} as const;

type ExportSectionKey = keyof typeof EXPORT_SECTION_LABELS;
type ExportFormat = "json" | "csv" | "pdf";

function buildCsvSection(title: string, rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return `${title}\nNo data\n`;
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const body = rows
    .map((row) =>
      headers
        .map((header) => {
          const raw = row[header];
          const text =
            raw == null
              ? ""
              : typeof raw === "object"
                ? JSON.stringify(raw)
                : String(raw);
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");

  return `${title}\n${headerLine}\n${body}\n`;
}

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

  const [contestComparisonFilters, setContestComparisonFilters] = useState({
    leftContest: "contest-1",
    rightContest: "contest-2",
  });
  const [groupComparisonFilters, setGroupComparisonFilters] = useState({
    leftContest: "contest-1",
    leftGroup: "group-a",
    rightContest: "contest-2",
    rightGroup: "group-b",
  });
  const [studentComparisonFilters, setStudentComparisonFilters] = useState({
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
    const leftContest = contestRows.find(
      (row) => row.contest_id === contestComparisonFilters.leftContest,
    );
    const rightContest = contestRows.find(
      (row) => row.contest_id === contestComparisonFilters.rightContest,
    );

    if (!leftContest || !rightContest) {
      return [];
    }

    return [
      buildComparisonRow(
        "Solve Rate",
        leftContest.solve_rate,
        rightContest.solve_rate,
        "percent",
      ),
      buildComparisonRow(
        "Mean Solve Time",
        leftContest.mean_solve_time_minutes ?? 0,
        rightContest.mean_solve_time_minutes ?? 0,
        "minutes",
      ),
      buildComparisonRow(
        "Median Solve Time",
        leftContest.median_solve_time_minutes ?? 0,
        rightContest.median_solve_time_minutes ?? 0,
        "minutes",
      ),
      buildComparisonRow(
        "Attempts to Solve",
        leftContest.attempts_to_solve ?? 0,
        rightContest.attempts_to_solve ?? 0,
        "decimal",
      ),
    ];
  }, [contestComparisonFilters.leftContest, contestComparisonFilters.rightContest, contestRows]);

  const groupComparisonRows = useMemo(() => {
    const toSegmentKey = (value: string): "groupA" | "groupB" | "groupC" => {
      if (value === "group-a") return "groupA";
      if (value === "group-b") return "groupB";
      return "groupC";
    };

    const leftProblems =
      MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[
        toSegmentKey(groupComparisonFilters.leftGroup)
      ].problem_metrics.filter((row) => row.contest_id === groupComparisonFilters.leftContest);
    const rightProblems =
      MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics[
        toSegmentKey(groupComparisonFilters.rightGroup)
      ].problem_metrics.filter((row) => row.contest_id === groupComparisonFilters.rightContest);

    return buildProblemComparisonRows(leftProblems, rightProblems);
  }, [
    groupComparisonFilters.leftContest,
    groupComparisonFilters.leftGroup,
    groupComparisonFilters.rightContest,
    groupComparisonFilters.rightGroup,
  ]);

  const leftStudentOptions = useMemo(() => {
    const selectedGroup =
      studentComparisonFilters.leftGroup === "group-a"
        ? "groupA"
        : studentComparisonFilters.leftGroup === "group-b"
          ? "groupB"
          : "groupC";

    return MOCK_INSTRUCTOR_ANALYTICS.students_catalog
      .filter((student) => student.segment === selectedGroup)
      .map((student) => ({
        label: student.name,
        value: student.computingId,
      }));
  }, [studentComparisonFilters.leftGroup]);

  const rightStudentOptions = useMemo(() => {
    const selectedGroup =
      studentComparisonFilters.rightGroup === "group-a"
        ? "groupA"
        : studentComparisonFilters.rightGroup === "group-b"
          ? "groupB"
          : "groupC";

    return MOCK_INSTRUCTOR_ANALYTICS.students_catalog
      .filter((student) => student.segment === selectedGroup)
      .map((student) => ({
        label: student.name,
        value: student.computingId,
      }));
  }, [studentComparisonFilters.rightGroup]);

  const studentComparisonRows = useMemo(() => {
    const leftStudent = MOCK_INSTRUCTOR_ANALYTICS.student_views[studentComparisonFilters.leftStudent];
    const rightStudent = MOCK_INSTRUCTOR_ANALYTICS.student_views[studentComparisonFilters.rightStudent];

    const leftContest = leftStudent?.contest_metrics.find(
      (row) => row.contest_id === studentComparisonFilters.leftContest,
    );
    const rightContest = rightStudent?.contest_metrics.find(
      (row) => row.contest_id === studentComparisonFilters.rightContest,
    );
    const leftProblems =
      leftStudent?.problem_metrics.filter(
        (row) => row.contest_id === studentComparisonFilters.leftContest,
      ) ?? [];
    const rightProblems =
      rightStudent?.problem_metrics.filter(
        (row) => row.contest_id === studentComparisonFilters.rightContest,
      ) ?? [];

    return [
      buildComparisonRow(
        "Solve Rate",
        leftContest?.solve_rate ?? 0,
        rightContest?.solve_rate ?? 0,
        "percent",
      ),
      buildComparisonRow(
        "Mean Solve Time",
        leftContest?.mean_solve_time_minutes ?? 0,
        rightContest?.mean_solve_time_minutes ?? 0,
        "minutes",
      ),
      buildComparisonRow(
        "Median Solve Time",
        leftContest?.median_solve_time_minutes ?? 0,
        rightContest?.median_solve_time_minutes ?? 0,
        "minutes",
      ),
      buildComparisonRow(
        "Attempts to Solve",
        leftContest?.attempts_to_solve ?? 0,
        rightContest?.attempts_to_solve ?? 0,
        "decimal",
      ),
      buildComparisonRow(
        "First Submission",
        average(leftProblems.map((row) => row.time_to_first_submission_minutes)),
        average(rightProblems.map((row) => row.time_to_first_submission_minutes)),
        "minutes",
      ),
      buildComparisonRow(
        "First Correct",
        average(leftProblems.map((row) => row.time_to_first_correct_submission_minutes)),
        average(rightProblems.map((row) => row.time_to_first_correct_submission_minutes)),
        "minutes",
      ),
      buildComparisonRow(
        "Post-Hint Solve",
        average(leftProblems.map((row) => row.post_hint_solve_probability)),
        average(rightProblems.map((row) => row.post_hint_solve_probability)),
        "percent",
      ),
      buildComparisonRow(
        "Attempts Before Hint",
        average(leftProblems.map((row) => row.attempts_before_hint)),
        average(rightProblems.map((row) => row.attempts_before_hint)),
        "decimal",
      ),
      buildComparisonRow(
        "Attempts After Hint",
        average(leftProblems.map((row) => row.attempts_after_hint)),
        average(rightProblems.map((row) => row.attempts_after_hint)),
        "decimal",
      ),
      buildComparisonRow(
        "Solve Time After Hint",
        average(leftProblems.map((row) => row.time_to_solve_after_hint_minutes)),
        average(rightProblems.map((row) => row.time_to_solve_after_hint_minutes)),
        "minutes",
      ),
    ];
  }, [
    studentComparisonFilters.leftContest,
    studentComparisonFilters.leftStudent,
    studentComparisonFilters.rightContest,
    studentComparisonFilters.rightStudent,
  ]);

  const leftContestLabel =
    contestOptions.find((option) => option.value === contestComparisonFilters.leftContest)?.label ??
    "Left Contest";
  const rightContestLabel =
    contestOptions.find((option) => option.value === contestComparisonFilters.rightContest)?.label ??
    "Right Contest";
  const leftGroupLabel =
    groupOptions.find((option) => option.value === groupComparisonFilters.leftGroup)?.label ??
    "Group A";
  const rightGroupLabel =
    groupOptions.find((option) => option.value === groupComparisonFilters.rightGroup)?.label ??
    "Group B";
  const leftStudentLabel =
    leftStudentOptions.find((option) => option.value === studentComparisonFilters.leftStudent)?.label ??
    "Left Student";
  const rightStudentLabel =
    rightStudentOptions.find((option) => option.value === studentComparisonFilters.rightStudent)?.label ??
    "Right Student";
  const leftGroupComparisonContestLabel =
    contestOptions.find((option) => option.value === groupComparisonFilters.leftContest)?.label ??
    "Left Contest";
  const rightGroupComparisonContestLabel =
    contestOptions.find((option) => option.value === groupComparisonFilters.rightContest)?.label ??
    "Right Contest";
  const leftStudentContestLabel =
    contestOptions.find((option) => option.value === studentComparisonFilters.leftContest)?.label ??
    "Left Contest";
  const rightStudentContestLabel =
    contestOptions.find((option) => option.value === studentComparisonFilters.rightContest)?.label ??
    "Right Contest";

  const activeGamificationTrend =
    gamificationTrendsByRange[gamificationFilters.dateRange] ?? gamificationTrendsByRange.all;
  const activeAiHintTrend =
    aiHintTrendsByRange[hintFilters.dateRange] ?? aiHintTrendsByRange.all;

  const exportSections = useMemo(() => {
    const sections: Record<ExportSectionKey, Array<Record<string, unknown>>> = {
      contestData: liveAnalyticsData.contestRows.map((row) => ({
        contest: row.contest_name,
        solveRate: formatPercent(row.solve_rate),
        meanSolveTime: `${formatNumber(row.mean_solve_time_minutes)} min`,
        medianSolveTime: `${formatNumber(row.median_solve_time_minutes)} min`,
        attemptsToSolve: formatNumber(row.attempts_to_solve),
      })),
      problemData: liveAnalyticsData.orderedProblemRows.map((row) => ({
        contest: row.contest_name,
        problem: `${row.problem_code} - ${row.problem_title}`,
        firstSubmission: `${formatNumber(row.time_to_first_submission_minutes)} min`,
        firstCorrect: `${formatNumber(row.time_to_first_correct_submission_minutes)} min`,
        postHintSolveProbability: formatPercent(row.post_hint_solve_probability),
        attemptsBeforeHint: formatNumber(row.attempts_before_hint),
        attemptsAfterHint: formatNumber(row.attempts_after_hint),
        solveTimeAfterHint: `${formatNumber(row.time_to_solve_after_hint_minutes)} min`,
      })),
      contestComparison: contestComparisonRows.map((row) => ({
        metric: row.label,
        leftContest: leftContestLabel,
        leftValue: row.leftValue,
        rightContest: rightContestLabel,
        rightValue: row.rightValue,
      })),
      groupComparison: groupComparisonRows.map((row) => ({
        metric: row.label,
        leftContest: leftGroupComparisonContestLabel,
        leftGroup: leftGroupLabel,
        leftValue: row.leftValue,
        rightContest: rightGroupComparisonContestLabel,
        rightGroup: rightGroupLabel,
        rightValue: row.rightValue,
      })),
      studentComparison: studentComparisonRows.map((row) => ({
        metric: row.label,
        leftContest: leftStudentContestLabel,
        leftGroup: studentComparisonFilters.leftGroup,
        leftStudent: leftStudentLabel,
        leftValue: row.leftValue,
        rightContest: rightStudentContestLabel,
        rightGroup: studentComparisonFilters.rightGroup,
        rightStudent: rightStudentLabel,
        rightValue: row.rightValue,
      })),
      gamificationStatistics: activeGamificationTrend.xLabels.map((label, index) => ({
        contest: label,
        participationRate: `${activeGamificationTrend.series[0]?.data[index] ?? 0}%`,
        completionRate: `${activeGamificationTrend.series[1]?.data[index] ?? 0}%`,
        repeatAttempts: `${activeGamificationTrend.series[2]?.data[index] ?? 0}%`,
      })),
      aiHintStatistics: activeAiHintTrend.xLabels.map((label, index) => ({
        contest: label,
        hintUsageRate: `${activeAiHintTrend.series[0]?.data[index] ?? 0}%`,
        postHintSolveRate: `${activeAiHintTrend.series[1]?.data[index] ?? 0}%`,
        attemptsAfterHint: `${activeAiHintTrend.series[2]?.data[index] ?? 0}%`,
      })),
    };

    return sections;
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
    setSelectedExportSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  const allSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).every(
    (key) => selectedExportSections[key],
  );
  const someSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).some(
    (key) => selectedExportSections[key],
  );

  function toggleAllExportSections(): void {
    const nextValue = !allSectionsSelected;
    setSelectedExportSections(
      (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).reduce<
        Record<ExportSectionKey, boolean>
      >((acc, key) => {
        acc[key] = nextValue;
        return acc;
      }, {} as Record<ExportSectionKey, boolean>),
    );
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
            <PolicyComparisonCard
              title="Contest Comparison"
              description=""
              leftLabel={leftContestLabel}
              rightLabel={rightContestLabel}
              rows={contestComparisonRows}
              filters={
                <SectionFiltersBar
                  fields={[
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
                  ]}
                />
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <PolicyComparisonCard
              title="Group Comparison"
              description=""
              leftLabel={leftGroupLabel}
              rightLabel={rightGroupLabel}
              rows={groupComparisonRows}
              filters={
                <SectionFiltersBar
                  fields={[
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
                  ]}
                />
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <PolicyComparisonCard
              title="Student Comparison"
              description=""
              leftLabel={leftStudentLabel}
              rightLabel={rightStudentLabel}
              rows={studentComparisonRows}
              filters={
                <SectionFiltersBar
                  fields={[
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
                        setStudentComparisonFilters((prev) => {
                          const nextSegment =
                            value === "group-a" ? "groupA" : value === "group-b" ? "groupB" : "groupC";
                          const nextStudents = MOCK_INSTRUCTOR_ANALYTICS.students_catalog
                            .filter((student) => student.segment === nextSegment)
                            .map((student) => student.computingId);

                          return {
                            ...prev,
                            leftGroup: value,
                            leftStudent: nextStudents[0] ?? prev.leftStudent,
                          };
                        }),
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
                        setStudentComparisonFilters((prev) => {
                          const nextSegment =
                            value === "group-a" ? "groupA" : value === "group-b" ? "groupB" : "groupC";
                          const nextStudents = MOCK_INSTRUCTOR_ANALYTICS.students_catalog
                            .filter((student) => student.segment === nextSegment)
                            .map((student) => student.computingId);

                          return {
                            ...prev,
                            rightGroup: value,
                            rightStudent: nextStudents[0] ?? prev.rightStudent,
                          };
                        }),
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

      <Dialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Export Analysis Data</DialogTitle>
        <DialogContent className={styles.exportDialogContent}>
          <Box className={styles.exportSectionList}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSectionsSelected}
                  indeterminate={!allSectionsSelected && someSectionsSelected}
                  onChange={toggleAllExportSections}
                />
              }
              label="Select All"
              className={styles.exportCheckbox}
            />
            {(Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).map((section) => (
              <FormControlLabel
                key={section}
                control={
                  <Checkbox
                    checked={selectedExportSections[section]}
                    onChange={() => toggleExportSection(section)}
                  />
                }
                label={EXPORT_SECTION_LABELS[section]}
                className={styles.exportCheckbox}
              />
            ))}
          </Box>

          <Box className={styles.exportFormatRow}>
            <Typography className={styles.exportFormatLabel}>File format</Typography>
            <FormControl size="small" className={styles.exportFormatControl}>
              <Select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: "0 24px 20px" }}>
          <Button onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={downloadExport}
            disabled={!Object.values(selectedExportSections).some(Boolean)}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
