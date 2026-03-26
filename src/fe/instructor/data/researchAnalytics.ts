import { ANALYSIS_CHART_COLORS } from "@/fe/instructor/data/analysisConstants";

export interface FilterOption {
  label: string;
  value: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  caption: string;
  highlight?: "danger";
}

export interface DistributionBar {
  label: string;
  value: number;
}

export interface ConditionDistribution {
  label: string;
  sampleSize: number;
  bars: DistributionBar[];
}

export interface SolveSummaryStat {
  label: string;
  value: string;
  caption: string;
  tone: "early" | "delayed" | "info";
}

export interface TimelinePoint {
  label: string;
  early: number;
  delayed: number;
}

export interface TimelineSeriesPoint {
  label: string;
  value: number;
}

export interface ContestTimelineSeries {
  contestId: string;
  contestLabel: string;
  color: string;
  points: TimelineSeriesPoint[];
}

export interface TrendDataset {
  xLabels: string[];
  xValues: number[];
  xGroups: Array<{
    label: string;
    start: number;
    end: number;
  }>;
  series: BarChartSeries[];
}

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

export interface BarChartSeries {
  label: string;
  color: string;
  data: number[];
}

export interface AnalyticsSummaryStat {
  label: string;
  value: string;
  caption: string;
  tone: "primary" | "secondary" | "accent";
}

export interface ConditionSummaryMetric {
  label: string;
  value: string;
  emphasis?: "positive" | "accent";
}

export interface ConditionSummaryPanel {
  id: string;
  title: string;
  tone: "early" | "delayed";
  metrics: ConditionSummaryMetric[];
}

export interface KeyFinding {
  label: string;
  value: string;
  tone: "positive" | "info";
}

export interface GroupComparisonMetricRow {
  label: string;
  leftValue: string;
  rightValue: string;
  leftPercent: number;
  rightPercent: number;
}

export interface ContestGroupComparison {
  contestId: string;
  contestLabel: string;
  groups: Record<string, GroupComparisonMetricRow[]>;
}

export interface TimingDistributionItem {
  label: string;
  value: string;
  danger?: boolean;
}

export interface HintDepthDistributionItem {
  label: string;
  value: number;
  tone: "early" | "mid" | "late";
}

export interface EngagementMetricCard {
  label: string;
  value: string;
  caption: string;
  tone?: "warning";
}

export interface ContestLiftRow {
  contest: string;
  participants: number;
  active: number;
  solveRate: string;
  hintUsage: string;
  medianTimeToHint: string;
  solveDelta: string;
  timeDelta: string;
  hintDelta: string;
}

export interface ProblemRow {
  problem: string;
  difficulty: "easy" | "medium" | "hard";
  attempted: number;
  solved: number;
  solveRate: string;
  medianAttempts: string;
  medianTime: string;
  hintUsage: string;
  solveDelta: string;
  hintDelta: string;
  attemptsDelta: string;
}

export interface IntegrityRow {
  label: string;
  value: string;
}

export interface CoverageRow {
  contest: string;
  value: string;
  status: "good" | "review";
}

export interface ResearchAnalyticsCopy {
  backButtonLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  exportDataLabel: string;
  researchFiltersTitle: string;
  filterContestLabel: string;
  filterDateRangeLabel: string;
  filterConditionLabel: string;
  filterPolicyLabel: string;
  filterConsentLabel: string;
  solveDistributionTitle: string;
  solveDistributionDescription: string;
  timelineTitle: string;
  timelineDescription: string;
  timelineYAxisLabel: string;
  timelineEarlyLegend: string;
  timelineDelayedLegend: string;
  timelineInsightLabel: string;
  timelineInsightText: string;
  policyComparisonTitle: string;
  policyComparisonDescription: string;
  policyKeyFindingsTitle: string;
  behaviorAnalysisTitle: string;
  behaviorAnalysisDescription: string;
  behaviorTimingTitle: string;
  behaviorDepthTitle: string;
  behaviorEngagementTitle: string;
  contestAnalysisTitle: string;
  contestAnalysisDescription: string;
  problemAnalysisTitle: string;
  problemAnalysisDescription: string;
  dataQualityTitle: string;
  dataQualityDescription: string;
  dataIntegrityTitle: string;
  loggingCoverageTitle: string;
  coverageGoodLabel: string;
  coverageReviewLabel: string;
}

export const contestOptions: FilterOption[] = [
  { label: "All Contests", value: "all" },
  { label: "Week 3 Lab", value: "week-3-lab" },
  { label: "Trees & Graphs", value: "trees-graphs" },
  { label: "Arrays & Strings", value: "arrays-strings" },
];

export const dateRangeOptions: FilterOption[] = [
  { label: "Past One Month", value: "1m" },
  { label: "Past One Semester", value: "1s" },
  { label: "Past One Year", value: "1y" },
  { label: "Since Launch", value: "all" },
];

export const conditionOptions: FilterOption[] = [
  { label: "All Groups", value: "all" },
  { label: "Group A", value: "group-a" },
  { label: "Group B", value: "group-b" },
  { label: "Group C", value: "group-c" },
];

export const policyOptions: FilterOption[] = [
  { label: "All Versions", value: "all" },
  { label: "v2.1", value: "v2.1" },
  { label: "v2.0", value: "v2.0" },
];

export const consentOptions: FilterOption[] = [
  { label: "Include All", value: "all" },
  { label: "Consented Only", value: "consented" },
];

export const researchAnalyticsCopy: ResearchAnalyticsCopy = {
  backButtonLabel: "BACK",
  pageTitle: "Instructor Research Analytics",
  pageSubtitle: "A/B testing platform for hint timing systems in competitive programming",
  exportDataLabel: "Export Data",
  researchFiltersTitle: "Research Filters",
  filterContestLabel: "Contest",
  filterDateRangeLabel: "Date Range",
  filterConditionLabel: "A/B Condition",
  filterPolicyLabel: "Policy Version",
  filterConsentLabel: "Consent Status",
  solveDistributionTitle: "Solve Time Distribution by Condition",
  solveDistributionDescription: "Comparing time-to-solve distributions across A/B conditions",
  timelineTitle: "Hint Engagement Timeline",
  timelineDescription: "When participants access hints during problem-solving",
  timelineYAxisLabel: "Hint Access Rate (%)",
  timelineEarlyLegend: "Early Hints",
  timelineDelayedLegend: "Delayed Hints",
  timelineInsightLabel: "Key Finding:",
  timelineInsightText:
    "Compare contest-level trajectories to identify where hint usage peaks and where participants delay hint engagement.",
  policyComparisonTitle: "A/B Comparison: Early vs Delayed Hint Timing",
  policyComparisonDescription: "Core research metrics comparing hint timing conditions",
  policyKeyFindingsTitle: "Key Findings (Early - Delayed)",
  behaviorAnalysisTitle: "Hint Behavior Analysis: Timing Evidence",
  behaviorAnalysisDescription: "Understanding when and how students use hints",
  behaviorTimingTitle: "Hint Timing Distribution",
  behaviorDepthTitle: "Hint Depth Distribution",
  behaviorEngagementTitle: "Engagement Metrics",
  contestAnalysisTitle: "Contest-Level Analysis with A/B Lift Metrics",
  contestAnalysisDescription: "Performance and A/B test results across all contests",
  problemAnalysisTitle: "Problem-Level Analysis with A/B Differences",
  problemAnalysisDescription: "Detailed performance metrics per problem - critical for CP research",
  dataQualityTitle: "Data Quality & Instrumentation Health",
  dataQualityDescription: "Logging coverage and data integrity metrics",
  dataIntegrityTitle: "Data Integrity",
  loggingCoverageTitle: "Logging Coverage by Contest",
  coverageGoodLabel: "✓ Good",
  coverageReviewLabel: "⚠ Review",
};

export const kpiMetrics: KpiMetric[] = [
  {
    id: "participants",
    label: "Total Participants",
    value: "298",
    caption: "45 new / 253 returning",
  },
  {
    id: "active",
    label: "Active in Range",
    value: "245",
    caption: "82% participation rate",
  },
  {
    id: "performance",
    label: "Performance",
    value: "67%",
    caption: "solve rate • Median time: 12m 35s",
  },
  {
    id: "risk",
    label: "At-Risk Participants",
    value: "18",
    caption: "≥10 failed attempts OR inactive ≥5 days OR stuck ≥30 min",
    highlight: "danger",
  },
];

export const solveDistribution: ConditionDistribution[] = [
  {
    label: "Early Hints",
    sampleSize: 149,
    bars: [
      { label: "0-10m", value: 45 },
      { label: "10-20m", value: 32 },
      { label: "20-30m", value: 15 },
      { label: "30m+", value: 8 },
    ],
  },
  {
    label: "Delayed Hints",
    sampleSize: 149,
    bars: [
      { label: "0-10m", value: 28 },
      { label: "10-20m", value: 38 },
      { label: "20-30m", value: 22 },
      { label: "30m+", value: 12 },
    ],
  },
];

export const solveSummaryStats: SolveSummaryStat[] = [
  { label: "Median", value: "11m 32s", caption: "Early", tone: "early" },
  { label: "Median", value: "15m 48s", caption: "Delayed", tone: "delayed" },
  { label: "p-value", value: "0.023", caption: "Significant", tone: "info" },
];

export const timelinePoints: TimelinePoint[] = [
  { label: "0-5m", early: 12, delayed: 5 },
  { label: "5-10m", early: 28, delayed: 15 },
  { label: "10-15m", early: 45, delayed: 28 },
  { label: "15-20m", early: 52, delayed: 38 },
  { label: "20-25m", early: 48, delayed: 42 },
  { label: "25-30m", early: 42, delayed: 46 },
  { label: "30-35m", early: 38, delayed: 40 },
  { label: "35m+", early: 35, delayed: 38 },
];

export const contestTimelineSeries: ContestTimelineSeries[] = [
  {
    contestId: "week-3-lab",
    contestLabel: "Week 3 Lab",
    color: ANALYSIS_CHART_COLORS.primary,
    points: [
      { label: "0-5m", value: 10 },
      { label: "5-10m", value: 24 },
      { label: "10-15m", value: 39 },
      { label: "15-20m", value: 45 },
      { label: "20-25m", value: 43 },
      { label: "25-30m", value: 36 },
      { label: "30-35m", value: 30 },
      { label: "35m+", value: 28 },
    ],
  },
  {
    contestId: "trees-graphs",
    contestLabel: "Trees & Graphs",
    color: ANALYSIS_CHART_COLORS.secondary,
    points: [
      { label: "0-5m", value: 7 },
      { label: "5-10m", value: 18 },
      { label: "10-15m", value: 30 },
      { label: "15-20m", value: 37 },
      { label: "20-25m", value: 41 },
      { label: "25-30m", value: 44 },
      { label: "30-35m", value: 40 },
      { label: "35m+", value: 35 },
    ],
  },
  {
    contestId: "arrays-strings",
    contestLabel: "Arrays & Strings",
    color: ANALYSIS_CHART_COLORS.accent,
    points: [
      { label: "0-5m", value: 9 },
      { label: "5-10m", value: 20 },
      { label: "10-15m", value: 34 },
      { label: "15-20m", value: 40 },
      { label: "20-25m", value: 38 },
      { label: "25-30m", value: 33 },
      { label: "30-35m", value: 29 },
      { label: "35m+", value: 26 },
    ],
  },
];

export const timelineAxisTicks: string[] = ["100", "75", "50", "25", "0"];

export const policyConditionPanels: ConditionSummaryPanel[] = [
  {
    id: "early",
    title: "Early Hints Condition",
    tone: "early",
    metrics: [
      { label: "Hint Exposure Rate", value: "78%" },
      { label: "Hint Usage Rate", value: "45%" },
      { label: "Time to First Hint", value: "8m 22s" },
      { label: "Hints per Problem", value: "1.8" },
      { label: "Solve Rate", value: "71%", emphasis: "positive" },
      { label: "Time to Solve", value: "18m 45s" },
      { label: "Attempts to Solve", value: "3.2" },
      { label: "Post-Hint Success", value: "58%" },
    ],
  },
  {
    id: "delayed",
    title: "Delayed Hints Condition",
    tone: "delayed",
    metrics: [
      { label: "Hint Exposure Rate", value: "72%" },
      { label: "Hint Usage Rate", value: "38%" },
      { label: "Time to First Hint", value: "15m 48s" },
      { label: "Hints per Problem", value: "1.4" },
      { label: "Solve Rate", value: "64%", emphasis: "accent" },
      { label: "Time to Solve", value: "22m 12s" },
      { label: "Attempts to Solve", value: "4.1" },
      { label: "Post-Hint Success", value: "52%" },
    ],
  },
];

export const policyKeyFindings: KeyFinding[] = [
  { label: "Solve Rate Lift", value: "+7%", tone: "positive" },
  { label: "Time Reduction", value: "-3m 27s", tone: "positive" },
  { label: "Hint Usage Lift", value: "+7%", tone: "info" },
];

export const contestGroupComparisons: ContestGroupComparison[] = [
  {
    contestId: "week-3-lab",
    contestLabel: "Week 3 Lab",
    groups: {
      "group-a:group-b": [
        { label: "Solve Rate", leftValue: "72%", rightValue: "64%", leftPercent: 72, rightPercent: 64 },
        { label: "Median Solve Time", leftValue: "14m", rightValue: "19m", leftPercent: 74, rightPercent: 56 },
        { label: "Attempts to Solve", leftValue: "2.8", rightValue: "4.1", leftPercent: 68, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "58%", rightValue: "46%", leftPercent: 58, rightPercent: 46 },
        { label: "Hint Usage", leftValue: "34%", rightValue: "51%", leftPercent: 67, rightPercent: 100 },
      ],
      "group-a:group-c": [
        { label: "Solve Rate", leftValue: "72%", rightValue: "61%", leftPercent: 72, rightPercent: 61 },
        { label: "Median Solve Time", leftValue: "14m", rightValue: "22m", leftPercent: 64, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "2.8", rightValue: "4.5", leftPercent: 62, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "58%", rightValue: "39%", leftPercent: 58, rightPercent: 39 },
        { label: "Hint Usage", leftValue: "34%", rightValue: "27%", leftPercent: 100, rightPercent: 79 },
      ],
      "group-b:group-c": [
        { label: "Solve Rate", leftValue: "64%", rightValue: "61%", leftPercent: 64, rightPercent: 61 },
        { label: "Median Solve Time", leftValue: "19m", rightValue: "22m", leftPercent: 86, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "4.1", rightValue: "4.5", leftPercent: 91, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "46%", rightValue: "39%", leftPercent: 46, rightPercent: 39 },
        { label: "Hint Usage", leftValue: "51%", rightValue: "27%", leftPercent: 100, rightPercent: 53 },
      ],
    },
  },
  {
    contestId: "trees-graphs",
    contestLabel: "Trees & Graphs",
    groups: {
      "group-a:group-b": [
        { label: "Solve Rate", leftValue: "68%", rightValue: "62%", leftPercent: 68, rightPercent: 62 },
        { label: "Median Solve Time", leftValue: "18m", rightValue: "23m", leftPercent: 78, rightPercent: 57 },
        { label: "Attempts to Solve", leftValue: "3.1", rightValue: "4.0", leftPercent: 78, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "53%", rightValue: "44%", leftPercent: 53, rightPercent: 44 },
        { label: "Hint Usage", leftValue: "42%", rightValue: "49%", leftPercent: 86, rightPercent: 100 },
      ],
      "group-a:group-c": [
        { label: "Solve Rate", leftValue: "68%", rightValue: "57%", leftPercent: 68, rightPercent: 57 },
        { label: "Median Solve Time", leftValue: "18m", rightValue: "26m", leftPercent: 69, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "3.1", rightValue: "4.7", leftPercent: 66, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "53%", rightValue: "36%", leftPercent: 53, rightPercent: 36 },
        { label: "Hint Usage", leftValue: "42%", rightValue: "31%", leftPercent: 100, rightPercent: 74 },
      ],
      "group-b:group-c": [
        { label: "Solve Rate", leftValue: "62%", rightValue: "57%", leftPercent: 62, rightPercent: 57 },
        { label: "Median Solve Time", leftValue: "23m", rightValue: "26m", leftPercent: 88, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "4.0", rightValue: "4.7", leftPercent: 85, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "44%", rightValue: "36%", leftPercent: 44, rightPercent: 36 },
        { label: "Hint Usage", leftValue: "49%", rightValue: "31%", leftPercent: 100, rightPercent: 63 },
      ],
    },
  },
  {
    contestId: "arrays-strings",
    contestLabel: "Arrays & Strings",
    groups: {
      "group-a:group-b": [
        { label: "Solve Rate", leftValue: "76%", rightValue: "69%", leftPercent: 76, rightPercent: 69 },
        { label: "Median Solve Time", leftValue: "12m", rightValue: "16m", leftPercent: 75, rightPercent: 56 },
        { label: "Attempts to Solve", leftValue: "2.2", rightValue: "3.1", leftPercent: 71, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "61%", rightValue: "55%", leftPercent: 61, rightPercent: 55 },
        { label: "Hint Usage", leftValue: "29%", rightValue: "38%", leftPercent: 76, rightPercent: 100 },
      ],
      "group-a:group-c": [
        { label: "Solve Rate", leftValue: "76%", rightValue: "63%", leftPercent: 76, rightPercent: 63 },
        { label: "Median Solve Time", leftValue: "12m", rightValue: "21m", leftPercent: 57, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "2.2", rightValue: "4.0", leftPercent: 55, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "61%", rightValue: "41%", leftPercent: 61, rightPercent: 41 },
        { label: "Hint Usage", leftValue: "29%", rightValue: "24%", leftPercent: 100, rightPercent: 83 },
      ],
      "group-b:group-c": [
        { label: "Solve Rate", leftValue: "69%", rightValue: "63%", leftPercent: 69, rightPercent: 63 },
        { label: "Median Solve Time", leftValue: "16m", rightValue: "21m", leftPercent: 76, rightPercent: 100 },
        { label: "Attempts to Solve", leftValue: "3.1", rightValue: "4.0", leftPercent: 78, rightPercent: 100 },
        { label: "Post-Hint Solve", leftValue: "55%", rightValue: "41%", leftPercent: 55, rightPercent: 41 },
        { label: "Hint Usage", leftValue: "38%", rightValue: "24%", leftPercent: 100, rightPercent: 63 },
      ],
    },
  },
];

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

export const hintTimingDistributionRows: TimingDistributionItem[] = [
  { label: "Before first attempt", value: "8%" },
  { label: "After 0 failed attempts", value: "12%" },
  { label: "After 1 failed attempt", value: "23%" },
  { label: "After 2 failed attempts", value: "28%" },
  { label: "After 3 failed attempts", value: "18%" },
  { label: "After 5+ failed attempts", value: "11%", danger: true },
];

export const hintDepthDistributionRows: HintDepthDistributionItem[] = [
  { label: "Level 1 (Basic)", value: 45, tone: "early" },
  { label: "Level 2 (Intermediate)", value: 35, tone: "mid" },
  { label: "Level 3 (Detailed)", value: 20, tone: "late" },
];

export const engagementMetricCards: EngagementMetricCard[] = [
  { label: "Median Dwell Time", value: "45s", caption: "Time hint panel open" },
  { label: "Latency After Hint", value: "2m 15s", caption: "Hint view → next attempt" },
  { label: "Over-reliance Rate", value: "14%", caption: "Hint within first 30s", tone: "warning" },
];

export const contestLiftRows: ContestLiftRow[] = [
  {
    contest: "Week 3 Lab Contest",
    participants: 0,
    active: 0,
    solveRate: "68%",
    hintUsage: "42%",
    medianTimeToHint: "9m 15s",
    solveDelta: "+7%",
    timeDelta: "-3m 27s",
    hintDelta: "+7%",
  },
  {
    contest: "Trees & Graphs Challenge",
    participants: 67,
    active: 56,
    solveRate: "71%",
    hintUsage: "48%",
    medianTimeToHint: "12m 30s",
    solveDelta: "+5%",
    timeDelta: "-4m 15s",
    hintDelta: "+10%",
  },
  {
    contest: "Arrays and Strings Basics",
    participants: 118,
    active: 100,
    solveRate: "62%",
    hintUsage: "35%",
    medianTimeToHint: "18m 45s",
    solveDelta: "+9%",
    timeDelta: "-2m 58s",
    hintDelta: "+3%",
  },
];

export const problemRows: ProblemRow[] = [
  {
    problem: "Two Sum",
    difficulty: "easy",
    attempted: 156,
    solved: 134,
    solveRate: "86%",
    medianAttempts: "1.8",
    medianTime: "8m 45s",
    hintUsage: "38%",
    solveDelta: "+5%",
    hintDelta: "-2m 15s",
    attemptsDelta: "-0.5",
  },
  {
    problem: "Binary Tree Traversal",
    difficulty: "medium",
    attempted: 142,
    solved: 89,
    solveRate: "63%",
    medianAttempts: "3.2",
    medianTime: "25m 12s",
    hintUsage: "52%",
    solveDelta: "+8%",
    hintDelta: "-3m 30s",
    attemptsDelta: "-0.8",
  },
  {
    problem: "Merge K Sorted Lists",
    difficulty: "hard",
    attempted: 98,
    solved: 42,
    solveRate: "43%",
    medianAttempts: "5.4",
    medianTime: "48m 30s",
    hintUsage: "68%",
    solveDelta: "+12%",
    hintDelta: "-5m 45s",
    attemptsDelta: "-1.2",
  },
  {
    problem: "Valid Palindrome",
    difficulty: "easy",
    attempted: 178,
    solved: 165,
    solveRate: "93%",
    medianAttempts: "1.3",
    medianTime: "5m 22s",
    hintUsage: "25%",
    solveDelta: "+3%",
    hintDelta: "-1m 20s",
    attemptsDelta: "-0.3",
  },
];

export const integrityRows: IntegrityRow[] = [
  { label: "Missing timestamps", value: "2.1%" },
  { label: "Missing A/B condition", value: "0.8%" },
  { label: "Hint open without unlock", value: "1.5%" },
];

export const coverageRows: CoverageRow[] = [
  { contest: "Week 3 Lab", value: "98.5%", status: "good" },
  { contest: "Trees & Graphs", value: "99.2%", status: "good" },
  { contest: "Arrays & Strings", value: "97.8%", status: "review" },
];

export interface ResearchAnalyticsDataset {
  copy: ResearchAnalyticsCopy;
  contestOptions: FilterOption[];
  dateRangeOptions: FilterOption[];
  conditionOptions: FilterOption[];
  policyOptions: FilterOption[];
  consentOptions: FilterOption[];
  kpiMetrics: KpiMetric[];
  solveDistribution: ConditionDistribution[];
  solveSummaryStats: SolveSummaryStat[];
  timelinePoints: TimelinePoint[];
  contestTimelineSeries: ContestTimelineSeries[];
  timelineAxisTicks: string[];
  policyConditionPanels: ConditionSummaryPanel[];
  policyKeyFindings: KeyFinding[];
  contestGroupComparisons: ContestGroupComparison[];
  gamificationTrendsByRange: Record<string, TrendDataset>;
  gamificationSummaryStatsByRange: Record<string, AnalyticsSummaryStat[]>;
  aiHintTrendsByRange: Record<string, TrendDataset>;
  hintTimingDistributionRows: TimingDistributionItem[];
  hintDepthDistributionRows: HintDepthDistributionItem[];
  engagementMetricCards: EngagementMetricCard[];
  contestLiftRows: ContestLiftRow[];
  problemRows: ProblemRow[];
  integrityRows: IntegrityRow[];
  coverageRows: CoverageRow[];
}

export const mockResearchAnalyticsDataset: ResearchAnalyticsDataset = {
  copy: researchAnalyticsCopy,
  contestOptions,
  dateRangeOptions,
  conditionOptions,
  policyOptions,
  consentOptions,
  kpiMetrics,
  solveDistribution,
  solveSummaryStats,
  timelinePoints,
  contestTimelineSeries,
  timelineAxisTicks,
  policyConditionPanels,
  policyKeyFindings,
  contestGroupComparisons,
  gamificationTrendsByRange,
  gamificationSummaryStatsByRange,
  aiHintTrendsByRange,
  hintTimingDistributionRows,
  hintDepthDistributionRows,
  engagementMetricCards,
  contestLiftRows,
  problemRows,
  integrityRows,
  coverageRows,
};
