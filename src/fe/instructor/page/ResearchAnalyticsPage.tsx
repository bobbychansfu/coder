"use client";

import { useRouter } from "next/navigation";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Button } from "@mui/material";
import {
  aiHintTrendsByRange,
  conditionOptions,
  dateRangeOptions,
  gamificationTrendsByRange,
  researchAnalyticsCopy,
} from "@/fe/instructor/data/researchAnalytics";
import ComparisonAnalyticsSection from "@/fe/instructor/components/ComparisonAnalyticsSection";
import ExportAnalysisDialog from "@/fe/instructor/components/ExportAnalysisDialog";
import HintEngagementTimelineCard from "@/fe/instructor/components/HintEngagementTimelineCard";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import LiveInstructorAnalyticsCard from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import SectionFiltersBar from "@/fe/instructor/components/SectionFiltersBar";
import SolveTimeDistributionCard from "@/fe/instructor/components/SolveTimeDistributionCard";
import { useResearchAnalyticsComparisons } from "@/fe/instructor/page/useResearchAnalyticsComparisons";
import { useResearchAnalyticsExport } from "@/fe/instructor/page/useResearchAnalyticsExport";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/ResearchAnalyticsPage.module.css";

const EXPORT_BUTTON_COLORS = {
  border: "rgba(217, 119, 6, 0.22)",
  background: "#fffaf3",
  text: "#c2410c",
  borderHover: "rgba(234, 88, 12, 0.35)",
  backgroundHover: "#fff2e2",
};

export default function ResearchAnalyticsPage() {
  const router = useRouter();
  const copy = researchAnalyticsCopy;

  const comparisons = useResearchAnalyticsComparisons({
    conditionOptions,
    gamificationTrendsByRange,
    aiHintTrendsByRange,
    sectionFilterIconClassName: styles.sectionFilterIcon,
  });

  const exportControls = useResearchAnalyticsExport({
    activeAiHintTrend: comparisons.activeAiHintTrend,
    activeGamificationTrend: comparisons.activeGamificationTrend,
    contestComparisonRows: comparisons.contestComparisonRows,
    groupComparisonRows: comparisons.groupComparisonRows,
    leftContestLabel: comparisons.leftContestLabel,
    leftGroupComparisonContestLabel: comparisons.leftGroupComparisonContestLabel,
    leftGroupLabel: comparisons.leftGroupLabel,
    leftStudentContestLabel: comparisons.leftStudentContestLabel,
    leftStudentGroup: comparisons.studentComparisonFilters.leftGroup,
    leftStudentLabel: comparisons.leftStudentLabel,
    liveAnalyticsData: comparisons.liveAnalyticsData,
    rightContestLabel: comparisons.rightContestLabel,
    rightGroupComparisonContestLabel: comparisons.rightGroupComparisonContestLabel,
    rightGroupLabel: comparisons.rightGroupLabel,
    rightStudentContestLabel: comparisons.rightStudentContestLabel,
    rightStudentGroup: comparisons.studentComparisonFilters.rightGroup,
    rightStudentLabel: comparisons.rightStudentLabel,
    studentComparisonRows: comparisons.studentComparisonRows,
  });

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
              title={copy.pageTitle}
              subtitle={copy.pageSubtitle}
              actions={
                <Button
                  className={styles.exportButton}
                  startIcon={<FileDownloadOutlinedIcon />}
                  variant="outlined"
                  onClick={exportControls.onOpen}
                  sx={{
                    textTransform: "none",
                    borderRadius: "10px",
                    borderColor: EXPORT_BUTTON_COLORS.border,
                    backgroundColor: EXPORT_BUTTON_COLORS.background,
                    color: EXPORT_BUTTON_COLORS.text,
                    "&:hover": {
                      borderColor: EXPORT_BUTTON_COLORS.borderHover,
                      backgroundColor: EXPORT_BUTTON_COLORS.backgroundHover,
                    },
                  }}
                >
                  {copy.exportDataLabel}
                </Button>
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <LiveInstructorAnalyticsCard
              viewMode={comparisons.liveViewMode}
              selectedContestId={comparisons.liveSelectedContestId}
              onViewModeChange={comparisons.setLiveViewMode}
              onSelectedContestIdChange={comparisons.setLiveSelectedContestId}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title={copy.contestComparisonTitle}
              leftLabel={comparisons.leftContestLabel}
              rightLabel={comparisons.rightContestLabel}
              rows={comparisons.contestComparisonRows}
              fields={comparisons.contestComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title={copy.groupComparisonTitle}
              leftLabel={comparisons.leftGroupLabel}
              rightLabel={comparisons.rightGroupLabel}
              rows={comparisons.groupComparisonRows}
              fields={comparisons.groupComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <ComparisonAnalyticsSection
              title={copy.studentComparisonTitle}
              leftLabel={comparisons.leftStudentLabel}
              rightLabel={comparisons.rightStudentLabel}
              rows={comparisons.studentComparisonRows}
              fields={comparisons.studentComparisonFields}
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <SolveTimeDistributionCard
              title={copy.gamificationStatisticsTitle}
              description=""
              xLabels={comparisons.activeGamificationTrend.xLabels}
              series={comparisons.activeGamificationTrend.series}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "gamification-range",
                      label: "Time Range",
                      value: comparisons.gamificationDateRange,
                      options: dateRangeOptions,
                      onChange: comparisons.setGamificationDateRange,
                      icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>

          <Box className={styles.sectionBlock}>
            <HintEngagementTimelineCard
              title={copy.aiHintStatisticsTitle}
              description=""
              yAxisLabel="Overall cohort metric"
              xLabels={comparisons.activeAiHintTrend.xLabels}
              series={comparisons.activeAiHintTrend.series}
              filters={
                <SectionFiltersBar
                  fields={[
                    {
                      id: "hint-range",
                      label: "Time Range",
                      value: comparisons.hintDateRange,
                      options: dateRangeOptions,
                      onChange: comparisons.setHintDateRange,
                      icon: <CalendarMonthOutlinedIcon className={styles.sectionFilterIcon} />,
                    },
                  ]}
                />
              }
            />
          </Box>
        </Box>
      </Box>

      <ExportAnalysisDialog
        open={exportControls.isExportDialogOpen}
        exportFormat={exportControls.exportFormat}
        selectedSections={exportControls.selectedSections}
        allSectionsSelected={exportControls.allSectionsSelected}
        someSectionsSelected={exportControls.someSectionsSelected}
        onClose={exportControls.onClose}
        onExport={exportControls.onExport}
        onExportFormatChange={exportControls.onExportFormatChange}
        onToggleAll={exportControls.onToggleAll}
        onToggleSection={exportControls.onToggleSection}
      />
    </>
  );
}
