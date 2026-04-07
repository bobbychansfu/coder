import type { FilterOption, ResearchAnalyticsCopy } from "./researchAnalytics.types";

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
  backButtonLabel: "Back",
  pageTitle: "Research Analytics Dashboard",
  pageSubtitle: "",
  exportDataLabel: "Export Data",
  contestComparisonTitle: "Contest Comparison",
  groupComparisonTitle: "Group Comparison",
  studentComparisonTitle: "Student Comparison",
  gamificationStatisticsTitle: "Gamification Statistics",
  aiHintStatisticsTitle: "AI Hint Statistics",
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
