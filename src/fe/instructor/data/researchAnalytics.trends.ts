import { ANALYSIS_CHART_COLORS } from "@/fe/instructor/data/analysisConstants";
import type { AnalyticsSummaryStat, BarChartSeries, TrendDataset } from "./researchAnalytics.types";

function buildTrendDataset(
  points: Array<{ label: string; value: number; semester: string }>,
  series: BarChartSeries[],
): TrendDataset {
  const semesterRanges = new Map<string, { start: number; end: number }>();

  for (const point of points) {
    const current = semesterRanges.get(point.semester);
    if (!current) {
      semesterRanges.set(point.semester, { start: point.value, end: point.value });
      continue;
    }

    current.start = Math.min(current.start, point.value);
    current.end = Math.max(current.end, point.value);
  }

  return {
    xLabels: points.map((point) => point.label),
    xValues: points.map((point) => point.value),
    xGroups: [...semesterRanges.entries()].map(([label, range]) => ({
      label,
      start: Math.max(0, range.start - 18),
      end: range.end + 18,
    })),
    series,
  };
}

export const gamificationTrendsByRange: Record<string, TrendDataset> = {
  "1w": {
    xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    xValues: [4, 11, 19, 27],
    xGroups: [{ label: "2026 Spring", start: 0, end: 30 }],
    series: [
      { label: "Participation Rate", color: ANALYSIS_CHART_COLORS.primary, data: [74, 69, 82, 77] },
      { label: "Completion Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [58, 51, 67, 63] },
      { label: "Repeat Attempts", color: ANALYSIS_CHART_COLORS.accent, data: [26, 34, 21, 24] },
    ],
  },
  "1m": buildTrendDataset(
    [
      { label: "Week 3 Lab", value: 4, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 12, semester: "2026 Spring" },
      { label: "Arrays & Strings", value: 21, semester: "2026 Spring" },
      { label: "DP Sprint", value: 29, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 37, semester: "2026 Spring" },
      { label: "Heap and Hash", value: 46, semester: "2026 Spring" },
    ],
    [
      { label: "Participation Rate", color: ANALYSIS_CHART_COLORS.primary, data: [84, 71, 89, 86, 74, 78] },
      { label: "Completion Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [68, 52, 76, 72, 59, 64] },
      { label: "Repeat Attempts", color: ANALYSIS_CHART_COLORS.accent, data: [31, 43, 24, 28, 34, 26] },
    ],
  ),
  "1s": buildTrendDataset(
    [
      { label: "Warmup", value: 14, semester: "2025 Fall" },
      { label: "Week 3 Lab", value: 58, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 91, semester: "2026 Spring" },
      { label: "Arrays & Strings", value: 146, semester: "2026 Summer" },
      { label: "Recursion Relay", value: 183, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 216, semester: "2026 Summer" },
    ],
    [
      { label: "Participation Rate", color: ANALYSIS_CHART_COLORS.primary, data: [62, 78, 71, 83, 69, 75] },
      { label: "Completion Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [45, 61, 53, 70, 56, 62] },
      { label: "Repeat Attempts", color: ANALYSIS_CHART_COLORS.accent, data: [19, 27, 36, 23, 31, 25] },
    ],
  ),
  "1y": buildTrendDataset(
    [
      { label: "Intro Lab", value: 28, semester: "2025 Spring" },
      { label: "Summer Sprint", value: 121, semester: "2025 Summer" },
      { label: "Warmup", value: 216, semester: "2025 Fall" },
      { label: "Week 3 Lab", value: 309, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 356, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 402, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 449, semester: "2026 Summer" },
    ],
    [
      { label: "Participation Rate", color: ANALYSIS_CHART_COLORS.primary, data: [57, 74, 68, 81, 73, 69, 77] },
      { label: "Completion Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [39, 58, 49, 66, 57, 54, 61] },
      { label: "Repeat Attempts", color: ANALYSIS_CHART_COLORS.accent, data: [15, 25, 33, 22, 29, 31, 24] },
    ],
  ),
  all: buildTrendDataset(
    [
      { label: "Intro Lab", value: 34, semester: "2023 Spring" },
      { label: "Summer Sprint", value: 149, semester: "2023 Summer" },
      { label: "Graph Warmup", value: 273, semester: "2023 Fall" },
      { label: "Week 3 Lab", value: 398, semester: "2024 Spring" },
      { label: "Arrays Camp", value: 512, semester: "2024 Summer" },
      { label: "Trees & Graphs", value: 639, semester: "2024 Fall" },
      { label: "Dynamic Programming", value: 759, semester: "2025 Spring" },
      { label: "Strings Marathon", value: 874, semester: "2025 Summer" },
      { label: "Greedy Open", value: 998, semester: "2025 Fall" },
      { label: "AI Hint Trial", value: 1116, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 1191, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 1268, semester: "2026 Summer" },
    ],
    [
      { label: "Participation Rate", color: ANALYSIS_CHART_COLORS.primary, data: [48, 53, 50, 61, 64, 59, 68, 72, 75, 81, 73, 77] },
      { label: "Completion Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [30, 34, 33, 42, 46, 43, 52, 57, 61, 66, 58, 63] },
      { label: "Repeat Attempts", color: ANALYSIS_CHART_COLORS.accent, data: [11, 13, 15, 18, 20, 24, 28, 26, 30, 22, 27, 24] },
    ],
  ),
};

export const gamificationSummaryStatsByRange: Record<string, AnalyticsSummaryStat[]> = {
  "1w": [
    { label: "Peak Participation", value: "82%", caption: "2026 Spring · Week 3", tone: "primary" },
    { label: "Peak Completion", value: "67%", caption: "2026 Spring · Week 3", tone: "secondary" },
    { label: "Most Repeat Attempts", value: "34%", caption: "2026 Spring · Week 2", tone: "accent" },
  ],
  "1m": [
    { label: "Peak Participation", value: "89%", caption: "2026 Spring · Arrays & Strings", tone: "primary" },
    { label: "Peak Completion", value: "76%", caption: "2026 Spring · Arrays & Strings", tone: "secondary" },
    { label: "Most Repeat Attempts", value: "43%", caption: "2026 Spring · Trees & Graphs", tone: "accent" },
  ],
  "1s": [
    { label: "Peak Participation", value: "83%", caption: "2026 Summer · Arrays & Strings", tone: "primary" },
    { label: "Peak Completion", value: "70%", caption: "2026 Summer · Arrays & Strings", tone: "secondary" },
    { label: "Most Repeat Attempts", value: "36%", caption: "2026 Spring · Trees & Graphs", tone: "accent" },
  ],
  "1y": [
    { label: "Peak Participation", value: "81%", caption: "2026 Spring · Week 3 Lab", tone: "primary" },
    { label: "Peak Completion", value: "66%", caption: "2026 Spring · Week 3 Lab", tone: "secondary" },
    { label: "Most Repeat Attempts", value: "33%", caption: "2025 Fall · Warmup", tone: "accent" },
  ],
  all: [
    { label: "Peak Participation", value: "81%", caption: "2026 Spring · AI Hint Trial", tone: "primary" },
    { label: "Peak Completion", value: "66%", caption: "2026 Spring · AI Hint Trial", tone: "secondary" },
    { label: "Most Repeat Attempts", value: "30%", caption: "2025 Fall · Greedy Open", tone: "accent" },
  ],
};

export const aiHintTrendsByRange: Record<string, TrendDataset> = {
  "1w": {
    xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    xValues: [4, 11, 19, 27],
    xGroups: [{ label: "2026 Spring", start: 0, end: 30 }],
    series: [
      { label: "Hint Usage Rate", color: ANALYSIS_CHART_COLORS.primary, data: [28, 34, 22, 30] },
      { label: "Post-Hint Solve Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [54, 49, 58, 56] },
      { label: "Attempts After Hint", color: ANALYSIS_CHART_COLORS.accent, data: [16, 22, 13, 17] },
    ],
  },
  "1m": buildTrendDataset(
    [
      { label: "Week 3 Lab", value: 4, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 12, semester: "2026 Spring" },
      { label: "Arrays & Strings", value: 21, semester: "2026 Spring" },
      { label: "DP Sprint", value: 29, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 37, semester: "2026 Spring" },
      { label: "Heap and Hash", value: 46, semester: "2026 Spring" },
    ],
    [
      { label: "Hint Usage Rate", color: ANALYSIS_CHART_COLORS.primary, data: [36, 44, 28, 33, 39, 31] },
      { label: "Post-Hint Solve Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [58, 49, 61, 57, 54, 63] },
      { label: "Attempts After Hint", color: ANALYSIS_CHART_COLORS.accent, data: [18, 27, 14, 16, 21, 15] },
    ],
  ),
  "1s": buildTrendDataset(
    [
      { label: "Warmup", value: 14, semester: "2025 Fall" },
      { label: "Week 3 Lab", value: 58, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 91, semester: "2026 Spring" },
      { label: "Arrays & Strings", value: 146, semester: "2026 Summer" },
      { label: "Recursion Relay", value: 183, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 216, semester: "2026 Summer" },
    ],
    [
      { label: "Hint Usage Rate", color: ANALYSIS_CHART_COLORS.primary, data: [18, 29, 41, 26, 35, 28] },
      { label: "Post-Hint Solve Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [46, 55, 48, 60, 52, 59] },
      { label: "Attempts After Hint", color: ANALYSIS_CHART_COLORS.accent, data: [11, 16, 24, 13, 18, 14] },
    ],
  ),
  "1y": buildTrendDataset(
    [
      { label: "Intro Lab", value: 28, semester: "2025 Spring" },
      { label: "Summer Sprint", value: 121, semester: "2025 Summer" },
      { label: "Warmup", value: 216, semester: "2025 Fall" },
      { label: "Week 3 Lab", value: 309, semester: "2026 Spring" },
      { label: "Trees & Graphs", value: 356, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 402, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 449, semester: "2026 Summer" },
    ],
    [
      { label: "Hint Usage Rate", color: ANALYSIS_CHART_COLORS.primary, data: [15, 27, 39, 25, 34, 31, 26] },
      { label: "Post-Hint Solve Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [42, 53, 47, 58, 51, 55, 60] },
      { label: "Attempts After Hint", color: ANALYSIS_CHART_COLORS.accent, data: [9, 15, 22, 12, 18, 17, 13] },
    ],
  ),
  all: buildTrendDataset(
    [
      { label: "Intro Lab", value: 34, semester: "2023 Spring" },
      { label: "Summer Sprint", value: 149, semester: "2023 Summer" },
      { label: "Graph Warmup", value: 273, semester: "2023 Fall" },
      { label: "Week 3 Lab", value: 398, semester: "2024 Spring" },
      { label: "Arrays Camp", value: 512, semester: "2024 Summer" },
      { label: "Trees & Graphs", value: 639, semester: "2024 Fall" },
      { label: "Dynamic Programming", value: 759, semester: "2025 Spring" },
      { label: "Strings Marathon", value: 874, semester: "2025 Summer" },
      { label: "Greedy Open", value: 998, semester: "2025 Fall" },
      { label: "AI Hint Trial", value: 1116, semester: "2026 Spring" },
      { label: "Recursion Relay", value: 1191, semester: "2026 Summer" },
      { label: "Heap and Hash", value: 1268, semester: "2026 Summer" },
    ],
    [
      { label: "Hint Usage Rate", color: ANALYSIS_CHART_COLORS.primary, data: [10, 13, 16, 21, 24, 31, 35, 33, 38, 29, 34, 27] },
      { label: "Post-Hint Solve Rate", color: ANALYSIS_CHART_COLORS.secondary, data: [36, 39, 41, 46, 49, 53, 57, 55, 58, 60, 56, 62] },
      { label: "Attempts After Hint", color: ANALYSIS_CHART_COLORS.accent, data: [6, 8, 9, 11, 13, 16, 19, 17, 20, 14, 18, 15] },
    ],
  ),
};
