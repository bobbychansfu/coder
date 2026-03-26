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
  { label: "Last 30 days", value: "30d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 7 days", value: "7d" },
];

export const conditionOptions: FilterOption[] = [
  { label: "All Conditions", value: "all" },
  { label: "Early Hints", value: "early" },
  { label: "Delayed Hints", value: "delayed" },
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
  backButtonLabel: "Back",
  pageTitle: "Research Analytics Dashboard",
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
    color: "#00c950",
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
    color: "#155dfc",
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
    color: "#9810fa",
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
  hintTimingDistributionRows,
  hintDepthDistributionRows,
  engagementMetricCards,
  contestLiftRows,
  problemRows,
  integrityRows,
  coverageRows,
};
