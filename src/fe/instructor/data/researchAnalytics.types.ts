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

export interface BarChartSeries {
  label: string;
  color: string;
  data: number[];
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
  contestComparisonTitle: string;
  groupComparisonTitle: string;
  studentComparisonTitle: string;
  gamificationStatisticsTitle: string;
  aiHintStatisticsTitle: string;
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
