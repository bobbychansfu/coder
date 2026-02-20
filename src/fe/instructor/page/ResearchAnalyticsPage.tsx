"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Button } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import {
  mockResearchAnalyticsDataset,
} from "@/fe/instructor/data";
import BehaviorAnalysisCard from "@/fe/instructor/components/BehaviorAnalysisCard";
import DataQualityHealthCard from "@/fe/instructor/components/DataQualityHealthCard";
import HintEngagementTimelineCard from "@/fe/instructor/components/HintEngagementTimelineCard";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import PolicyComparisonCard from "@/fe/instructor/components/PolicyComparisonCard";
import ProblemAnalysisCard from "@/fe/instructor/components/ProblemAnalysisCard";
import SectionFiltersBar from "@/fe/instructor/components/SectionFiltersBar";
import SolveTimeDistributionCard from "@/fe/instructor/components/SolveTimeDistributionCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

export default function ResearchAnalyticsPage() {
  const router = useRouter();
  const {
    copy,
    contestOptions,
    dateRangeOptions,
    conditionOptions,
    policyOptions,
    consentOptions,
    kpiMetrics,
    solveDistribution,
    solveSummaryStats,
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
  } = mockResearchAnalyticsDataset;

  const [solveFilters, setSolveFilters] = useState({
    contest: "all",
    dateRange: "30d",
    condition: "all",
  });
  const [timelineFilters, setTimelineFilters] = useState({
    contest: "all",
  });
  const [policyFilters, setPolicyFilters] = useState({
    contest: "all",
    condition: "all",
    policy: "all",
  });
  const [behaviorFilters, setBehaviorFilters] = useState({
    contest: "all",
    dateRange: "30d",
  });
  const [contestAnalysisFilters, setContestAnalysisFilters] = useState({
    contest: "all",
    dateRange: "30d",
    condition: "all",
  });
  const [problemAnalysisFilters, setProblemAnalysisFilters] = useState({
    contest: "all",
    condition: "all",
  });
  const [qualityFilters, setQualityFilters] = useState({
    contest: "all",
    dateRange: "30d",
    consent: "all",
  });
  const selectedTimelineSeries =
    timelineFilters.contest === "all"
      ? contestTimelineSeries
      : contestTimelineSeries.filter((series) => series.contestId === timelineFilters.contest);
  const activeTimelineSeries = selectedTimelineSeries.length > 0 ? selectedTimelineSeries : contestTimelineSeries;
  const timelineLabels = activeTimelineSeries[0]?.points.map((point) => point.label) ?? [];
  const timelineChartSeries = activeTimelineSeries.map((series) => ({
    id: series.contestId,
    label: series.contestLabel,
    color: series.color,
    data: series.points.map((point) => point.value),
  }));

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.instructor)}
        backLabel={copy.backButtonLabel}
        backButtonClassName={subpageStyles.backButton}
      />

      <InstructorSubpageHeader
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
        actions={
          <Button
            className={styles.exportButton}
            startIcon={<FileDownloadOutlinedIcon />}
            variant="outlined"
          >
            {copy.exportDataLabel}
          </Button>
        }
      />

      <Box className={styles.kpiGrid}>
        {kpiMetrics.map((metric) => {
          const captionLines = metric.caption.split("•").map((line) => line.trim());
          const isRisk = metric.highlight === "danger";
          const caption =
            metric.id === "performance"
              ? captionLines.join("\n")
              : isRisk
                ? (
                    <>
                      <WarningAmberRoundedIcon className={styles.kpiRiskIcon} />
                      <span className={styles.kpiCaptionDanger}>{metric.caption}</span>
                    </>
                  )
                : metric.caption;

          return (
            <StatCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              caption={caption}
              className={`${styles.card} ${isRisk ? styles.kpiRiskCard : ""}`}
              labelClassName={isRisk ? styles.kpiLabelRisk : styles.kpiLabel}
              contentClassName={styles.kpiCardContent}
              valueClassName={isRisk ? styles.kpiValueRisk : styles.kpiValue}
              captionClassName={
                metric.id === "performance"
                  ? `${styles.kpiCaption} ${styles.kpiCaptionMultiline}`
                  : isRisk
                    ? styles.kpiRiskCaptionRow
                    : styles.kpiCaption
              }
            />
          );
        })}
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "solve-contest",
              label: copy.filterContestLabel,
              value: solveFilters.contest,
              options: contestOptions,
              onChange: (value) =>
                setSolveFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "solve-date-range",
              label: copy.filterDateRangeLabel,
              value: solveFilters.dateRange,
              options: dateRangeOptions,
              onChange: (value) =>
                setSolveFilters((prev) => ({ ...prev, dateRange: value })),
              icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "solve-condition",
              label: copy.filterConditionLabel,
              value: solveFilters.condition,
              options: conditionOptions,
              onChange: (value) =>
                setSolveFilters((prev) => ({ ...prev, condition: value })),
              icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <SolveTimeDistributionCard
          title={copy.solveDistributionTitle}
          description={copy.solveDistributionDescription}
          groups={solveDistribution}
          summaryStats={solveSummaryStats}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "timeline-contest",
              label: copy.filterContestLabel,
              value: timelineFilters.contest,
              options: contestOptions,
              onChange: (value) => setTimelineFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <HintEngagementTimelineCard
          title={copy.timelineTitle}
          description={copy.timelineDescription}
          yAxisLabel={copy.timelineYAxisLabel}
          yAxisTicks={timelineAxisTicks}
          xLabels={timelineLabels}
          series={timelineChartSeries}
          insightLabel={copy.timelineInsightLabel}
          insightText={copy.timelineInsightText}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "policy-contest",
              label: copy.filterContestLabel,
              value: policyFilters.contest,
              options: contestOptions,
              onChange: (value) => setPolicyFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "policy-condition",
              label: copy.filterConditionLabel,
              value: policyFilters.condition,
              options: conditionOptions,
              onChange: (value) => setPolicyFilters((prev) => ({ ...prev, condition: value })),
              icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "policy-version",
              label: copy.filterPolicyLabel,
              value: policyFilters.policy,
              options: policyOptions,
              onChange: (value) => setPolicyFilters((prev) => ({ ...prev, policy: value })),
              icon: <LayersOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <PolicyComparisonCard
          title={copy.policyComparisonTitle}
          description={copy.policyComparisonDescription}
          keyFindingsTitle={copy.policyKeyFindingsTitle}
          panels={policyConditionPanels}
          keyFindings={policyKeyFindings}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "behavior-contest",
              label: copy.filterContestLabel,
              value: behaviorFilters.contest,
              options: contestOptions,
              onChange: (value) => setBehaviorFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "behavior-date-range",
              label: copy.filterDateRangeLabel,
              value: behaviorFilters.dateRange,
              options: dateRangeOptions,
              onChange: (value) => setBehaviorFilters((prev) => ({ ...prev, dateRange: value })),
              icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <BehaviorAnalysisCard
          title={copy.behaviorAnalysisTitle}
          description={copy.behaviorAnalysisDescription}
          timingTitle={copy.behaviorTimingTitle}
          depthTitle={copy.behaviorDepthTitle}
          engagementTitle={copy.behaviorEngagementTitle}
          timingRows={hintTimingDistributionRows}
          depthRows={hintDepthDistributionRows}
          engagementRows={engagementMetricCards}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "contest-analysis-contest",
              label: copy.filterContestLabel,
              value: contestAnalysisFilters.contest,
              options: contestOptions,
              onChange: (value) =>
                setContestAnalysisFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "contest-analysis-date-range",
              label: copy.filterDateRangeLabel,
              value: contestAnalysisFilters.dateRange,
              options: dateRangeOptions,
              onChange: (value) =>
                setContestAnalysisFilters((prev) => ({ ...prev, dateRange: value })),
              icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "contest-analysis-condition",
              label: copy.filterConditionLabel,
              value: contestAnalysisFilters.condition,
              options: conditionOptions,
              onChange: (value) =>
                setContestAnalysisFilters((prev) => ({ ...prev, condition: value })),
              icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <ProblemAnalysisCard
          variant="contest"
          title={copy.contestAnalysisTitle}
          description={copy.contestAnalysisDescription}
          contestRows={contestLiftRows}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "problem-analysis-contest",
              label: copy.filterContestLabel,
              value: problemAnalysisFilters.contest,
              options: contestOptions,
              onChange: (value) =>
                setProblemAnalysisFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "problem-analysis-condition",
              label: copy.filterConditionLabel,
              value: problemAnalysisFilters.condition,
              options: conditionOptions,
              onChange: (value) =>
                setProblemAnalysisFilters((prev) => ({ ...prev, condition: value })),
              icon: <ScienceOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <ProblemAnalysisCard
          variant="problem"
          title={copy.problemAnalysisTitle}
          description={copy.problemAnalysisDescription}
          problemRows={problemRows}
        />
      </Box>

      <Box className={styles.sectionBlock}>
        <SectionFiltersBar
          fields={[
            {
              id: "quality-contest",
              label: copy.filterContestLabel,
              value: qualityFilters.contest,
              options: contestOptions,
              onChange: (value) => setQualityFilters((prev) => ({ ...prev, contest: value })),
              icon: <EmojiEventsOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "quality-date-range",
              label: copy.filterDateRangeLabel,
              value: qualityFilters.dateRange,
              options: dateRangeOptions,
              onChange: (value) => setQualityFilters((prev) => ({ ...prev, dateRange: value })),
              icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
            },
            {
              id: "quality-consent",
              label: copy.filterConsentLabel,
              value: qualityFilters.consent,
              options: consentOptions,
              onChange: (value) => setQualityFilters((prev) => ({ ...prev, consent: value })),
              icon: <PersonAddAltOutlinedIcon className={styles.sectionFilterIcon} />,
            },
          ]}
        />
        <DataQualityHealthCard
          title={copy.dataQualityTitle}
          description={copy.dataQualityDescription}
          integrityTitle={copy.dataIntegrityTitle}
          coverageTitle={copy.loggingCoverageTitle}
          goodLabel={copy.coverageGoodLabel}
          reviewLabel={copy.coverageReviewLabel}
          integrityRows={integrityRows}
          coverageRows={coverageRows}
        />
      </Box>
    </Box>
  );
}
