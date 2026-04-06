"use client";

import type { InstructorAnalysisData } from "@/lib/types/instructorAnalysis";

function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildFileStem(data: InstructorAnalysisData): string {
  const contestPart = sanitizeFilePart(data.contest.title ?? "analysis");
  const snapshotPart = sanitizeFilePart(data.snapshot.resolvedTypeLabel);
  return `instructor-analysis-${contestPart}-${snapshotPart}`;
}

function downloadBlob(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsvRow(values: string[]): string {
  return values.map(escapeCsvCell).join(",");
}

export function exportInstructorAnalysisJson(data: InstructorAnalysisData): void {
  const payload = {
    selection: data.selection,
    contest: data.contest,
    snapshot: data.snapshot,
    contestGroupMetrics: data.contestGroupMetrics,
    problemStudentMetrics: data.problemStudentMetrics,
  };

  downloadBlob(
    `${buildFileStem(data)}.json`,
    "application/json;charset=utf-8",
    `${JSON.stringify(payload, null, 2)}\n`,
  );
}

export function exportInstructorAnalysisCsv(data: InstructorAnalysisData): void {
  const lines: string[] = [
    buildCsvRow(["Section", "Field", "Value"]),
    buildCsvRow(["snapshot", "contest", data.contest.title ?? "-"]),
    buildCsvRow(["snapshot", "contestStatus", data.contest.statusLabel]),
    buildCsvRow(["snapshot", "requestedPreference", data.snapshot.requestedPreferenceLabel]),
    buildCsvRow(["snapshot", "resolvedSnapshot", data.snapshot.resolvedTypeLabel]),
    buildCsvRow(["snapshot", "status", data.snapshot.statusLabel]),
    buildCsvRow(["snapshot", "watermark", data.snapshot.watermarkLabel]),
    buildCsvRow(["snapshot", "computedAt", data.snapshot.computedAtLabel]),
    buildCsvRow(["snapshot", "message", data.snapshot.message]),
    "",
    buildCsvRow([
      "contestGroupMetrics",
      "group",
      "solveRate",
      "meanSolveTime",
      "medianSolveTime",
      "attemptsToSolve",
    ]),
    ...data.contestGroupMetrics.map((row) =>
      buildCsvRow([
        "",
        row.groupLabel,
        row.solveRate,
        row.meanSolveTime,
        row.medianSolveTime,
        row.attemptsToSolve,
      ]),
    ),
    "",
    buildCsvRow([
      "problemStudentMetrics",
      "studentId",
      "studentName",
      "group",
      "timeToFirstSubmission",
      "timeToFirstCorrect",
      "postHintSolveProbability",
      "attemptsBeforeHint",
      "attemptsAfterHint",
      "timeToSolveAfterHint",
    ]),
    ...data.problemStudentMetrics.map((row) =>
      buildCsvRow([
        "",
        row.studentId,
        row.studentName,
        row.groupLabel,
        row.timeToFirstSubmission,
        row.timeToFirstCorrect,
        row.postHintSolveProbability,
        row.attemptsBeforeHint,
        row.attemptsAfterHint,
        row.timeToSolveAfterHint,
      ]),
    ),
  ];

  downloadBlob(`${buildFileStem(data)}.csv`, "text/csv;charset=utf-8", lines.join("\n"));
}
