"use client";

import { useMemo, useState } from "react";
import type {
  GroupComparisonMetricRow,
  TrendDataset,
} from "@/fe/instructor/data/researchAnalytics";
import type { LiveInstructorAnalyticsResolvedData } from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import {
  buildCsvSection,
  buildExportSections,
  EXPORT_SECTION_LABELS,
  formatNumber,
  formatPercent,
  toggleAllSectionSelections,
  toggleSectionSelection,
  type ExportFormat,
  type ExportSectionKey,
} from "@/fe/instructor/page/researchAnalytics.helpers";

interface UseResearchAnalyticsExportArgs {
  activeAiHintTrend: TrendDataset;
  activeGamificationTrend: TrendDataset;
  contestComparisonRows: GroupComparisonMetricRow[];
  groupComparisonRows: GroupComparisonMetricRow[];
  leftContestLabel: string;
  leftGroupComparisonContestLabel: string;
  leftGroupLabel: string;
  leftStudentContestLabel: string;
  leftStudentGroup: string;
  leftStudentLabel: string;
  liveAnalyticsData: LiveInstructorAnalyticsResolvedData;
  rightContestLabel: string;
  rightGroupComparisonContestLabel: string;
  rightGroupLabel: string;
  rightStudentContestLabel: string;
  rightStudentGroup: string;
  rightStudentLabel: string;
  studentComparisonRows: GroupComparisonMetricRow[];
}

export function useResearchAnalyticsExport({
  activeAiHintTrend,
  activeGamificationTrend,
  contestComparisonRows,
  groupComparisonRows,
  leftContestLabel,
  leftGroupComparisonContestLabel,
  leftGroupLabel,
  leftStudentContestLabel,
  leftStudentGroup,
  leftStudentLabel,
  liveAnalyticsData,
  rightContestLabel,
  rightGroupComparisonContestLabel,
  rightGroupLabel,
  rightStudentContestLabel,
  rightStudentGroup,
  rightStudentLabel,
  studentComparisonRows,
}: UseResearchAnalyticsExportArgs) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [selectedExportSections, setSelectedExportSections] = useState<Record<ExportSectionKey, boolean>>({
    contestData: false,
    problemData: false,
    contestComparison: false,
    groupComparison: false,
    studentComparison: false,
    gamificationStatistics: false,
    aiHintStatistics: false,
  });

  const exportSections = useMemo(
    () =>
      buildExportSections({
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
        leftStudentGroup,
        rightStudentGroup,
        gamificationTrend: activeGamificationTrend,
        aiHintTrend: activeAiHintTrend,
      }),
    [
      activeAiHintTrend,
      activeGamificationTrend,
      contestComparisonRows,
      groupComparisonRows,
      leftContestLabel,
      leftGroupComparisonContestLabel,
      leftGroupLabel,
      leftStudentContestLabel,
      leftStudentGroup,
      leftStudentLabel,
      liveAnalyticsData.contestRows,
      liveAnalyticsData.orderedProblemRows,
      rightContestLabel,
      rightGroupComparisonContestLabel,
      rightGroupLabel,
      rightStudentContestLabel,
      rightStudentGroup,
      rightStudentLabel,
      studentComparisonRows,
    ],
  );

  const allSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).every(
    (key) => selectedExportSections[key],
  );
  const someSectionsSelected = (Object.keys(EXPORT_SECTION_LABELS) as ExportSectionKey[]).some(
    (key) => selectedExportSections[key],
  );

  function onToggleSection(section: ExportSectionKey): void {
    setSelectedExportSections((current) => toggleSectionSelection(current, section));
  }

  function onToggleAll(): void {
    setSelectedExportSections(toggleAllSectionSelections(!allSectionsSelected));
  }

  function onExport(): void {
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
      if (!printWindow) {
        window.alert("PDF export was blocked by the browser. Please allow pop-ups for this site or export as CSV/JSON.");
        return;
      }
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

  return {
    allSectionsSelected,
    exportFormat,
    isExportDialogOpen,
    onClose: () => setIsExportDialogOpen(false),
    onExport,
    onExportFormatChange: setExportFormat,
    onOpen: () => setIsExportDialogOpen(true),
    onToggleAll,
    onToggleSection,
    selectedSections: selectedExportSections,
    someSectionsSelected,
  };
}
