import { ANALYSIS_CHART_COLORS } from "@/fe/instructor/data/analysisConstants";
import {
  conditionOptions,
  consentOptions,
  contestOptions,
  dateRangeOptions,
  policyOptions,
  researchAnalyticsCopy,
} from "./researchAnalytics.content";
import {
  aiHintTrendsByRange,
  gamificationSummaryStatsByRange,
  gamificationTrendsByRange,
} from "./researchAnalytics.trends";
import type {
  ConditionDistribution,
  ConditionSummaryPanel,
  ContestGroupComparison,
  ContestLiftRow,
  ContestTimelineSeries,
  CoverageRow,
  EngagementMetricCard,
  HintDepthDistributionItem,
  IntegrityRow,
  KeyFinding,
  KpiMetric,
  ProblemRow,
  ResearchAnalyticsDataset,
  SolveSummaryStat,
  TimelinePoint,
  TimingDistributionItem,
} from "./researchAnalytics.types";

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
