"use client";

import { useMemo, useState } from "react";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import {
  MOCK_INSTRUCTOR_ANALYTICS,
  type ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics";
import type { FilterOption, TrendDataset } from "@/fe/instructor/data/researchAnalytics";
import { resolveLiveInstructorAnalyticsData } from "@/fe/instructor/components/LiveInstructorAnalyticsCard";
import type { SectionFilterField } from "@/fe/instructor/components/SectionFiltersBar";
import {
  buildContestComparisonRows,
  buildGroupComparisonRows,
  buildStudentComparisonRows,
  buildStudentOptions,
  getDefaultStudentIdForGroup,
  getOptionLabel,
  type ContestComparisonFilters,
  type GroupComparisonFilters,
  type StudentComparisonFilters,
} from "@/fe/instructor/page/researchAnalytics.helpers";

interface UseResearchAnalyticsComparisonsArgs {
  conditionOptions: FilterOption[];
  gamificationTrendsByRange: Record<string, TrendDataset>;
  aiHintTrendsByRange: Record<string, TrendDataset>;
  sectionFilterIconClassName: string;
}

export function useResearchAnalyticsComparisons({
  conditionOptions,
  gamificationTrendsByRange,
  aiHintTrendsByRange,
  sectionFilterIconClassName,
}: UseResearchAnalyticsComparisonsArgs) {
  const contestOptions = useMemo(
    () =>
      MOCK_INSTRUCTOR_ANALYTICS.contests_catalog.map((contest) => ({
        label: contest.name,
        value: contest.id,
      })),
    [],
  );

  const groupOptions = useMemo(
    () => conditionOptions.filter((option) => option.value !== "all"),
    [conditionOptions],
  );

  const [contestComparisonFilters, setContestComparisonFilters] = useState<ContestComparisonFilters>({
    leftContest: "contest-1",
    rightContest: "contest-2",
  });
  const [groupComparisonFilters, setGroupComparisonFilters] = useState<GroupComparisonFilters>({
    leftContest: "contest-1",
    leftGroup: "group-a",
    rightContest: "contest-2",
    rightGroup: "group-b",
  });
  const [studentComparisonFilters, setStudentComparisonFilters] = useState<StudentComparisonFilters>({
    leftContest: "contest-1",
    leftGroup: "group-a",
    leftStudent: "student01",
    rightContest: "contest-8",
    rightGroup: "group-b",
    rightStudent: "student05",
  });
  const [liveViewMode, setLiveViewMode] = useState<ViewMode>("all");
  const [liveSelectedContestId, setLiveSelectedContestId] = useState("all");
  const [gamificationDateRange, setGamificationDateRange] = useState("1m");
  const [hintDateRange, setHintDateRange] = useState("1m");

  const contestRows = MOCK_INSTRUCTOR_ANALYTICS.segmented_metrics.all.contest_metrics;
  const liveAnalyticsData = useMemo(
    () => resolveLiveInstructorAnalyticsData(liveViewMode, liveSelectedContestId),
    [liveSelectedContestId, liveViewMode],
  );
  const contestComparisonRows = useMemo(
    () => buildContestComparisonRows(contestRows, contestComparisonFilters),
    [contestComparisonFilters, contestRows],
  );
  const groupComparisonRows = useMemo(
    () => buildGroupComparisonRows(MOCK_INSTRUCTOR_ANALYTICS, groupComparisonFilters),
    [groupComparisonFilters],
  );
  const leftStudentOptions = useMemo(
    () => buildStudentOptions(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters.leftGroup),
    [studentComparisonFilters.leftGroup],
  );
  const rightStudentOptions = useMemo(
    () => buildStudentOptions(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters.rightGroup),
    [studentComparisonFilters.rightGroup],
  );
  const studentComparisonRows = useMemo(
    () => buildStudentComparisonRows(MOCK_INSTRUCTOR_ANALYTICS, studentComparisonFilters),
    [studentComparisonFilters],
  );

  const leftContestLabel = getOptionLabel(contestOptions, contestComparisonFilters.leftContest, "Left Contest");
  const rightContestLabel = getOptionLabel(contestOptions, contestComparisonFilters.rightContest, "Right Contest");
  const leftGroupLabel = getOptionLabel(groupOptions, groupComparisonFilters.leftGroup, "Group A");
  const rightGroupLabel = getOptionLabel(groupOptions, groupComparisonFilters.rightGroup, "Group B");
  const leftStudentLabel = getOptionLabel(leftStudentOptions, studentComparisonFilters.leftStudent, "Left Student");
  const rightStudentLabel = getOptionLabel(
    rightStudentOptions,
    studentComparisonFilters.rightStudent,
    "Right Student",
  );
  const leftGroupComparisonContestLabel = getOptionLabel(
    contestOptions,
    groupComparisonFilters.leftContest,
    "Left Contest",
  );
  const rightGroupComparisonContestLabel = getOptionLabel(
    contestOptions,
    groupComparisonFilters.rightContest,
    "Right Contest",
  );
  const leftStudentContestLabel = getOptionLabel(
    contestOptions,
    studentComparisonFilters.leftContest,
    "Left Contest",
  );
  const rightStudentContestLabel = getOptionLabel(
    contestOptions,
    studentComparisonFilters.rightContest,
    "Right Contest",
  );

  const activeGamificationTrend =
    gamificationTrendsByRange[gamificationDateRange] ?? gamificationTrendsByRange.all;
  const activeAiHintTrend = aiHintTrendsByRange[hintDateRange] ?? aiHintTrendsByRange.all;

  const contestComparisonFields: SectionFilterField[] = [
    {
      id: "contest-comparison-left",
      label: "Left Contest",
      value: contestComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) => setContestComparisonFilters((prev) => ({ ...prev, leftContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "contest-comparison-right",
      label: "Right Contest",
      value: contestComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) => setContestComparisonFilters((prev) => ({ ...prev, rightContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
  ];

  const groupComparisonFields: SectionFilterField[] = [
    {
      id: "group-comparison-left-contest",
      label: "Left Contest",
      value: groupComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) => setGroupComparisonFilters((prev) => ({ ...prev, leftContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "group-comparison-left-group",
      label: "Left Group",
      value: groupComparisonFilters.leftGroup,
      options: groupOptions,
      onChange: (value) => setGroupComparisonFilters((prev) => ({ ...prev, leftGroup: value })),
      icon: <ScienceOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "group-comparison-right-contest",
      label: "Right Contest",
      value: groupComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) => setGroupComparisonFilters((prev) => ({ ...prev, rightContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "group-comparison-right-group",
      label: "Right Group",
      value: groupComparisonFilters.rightGroup,
      options: groupOptions,
      onChange: (value) => setGroupComparisonFilters((prev) => ({ ...prev, rightGroup: value })),
      icon: <ScienceOutlinedIcon className={sectionFilterIconClassName} />,
    },
  ];

  const studentComparisonFields: SectionFilterField[] = [
    {
      id: "student-comparison-left-contest",
      label: "Left Contest",
      value: studentComparisonFilters.leftContest,
      options: contestOptions,
      onChange: (value) => setStudentComparisonFilters((prev) => ({ ...prev, leftContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "student-comparison-left-group",
      label: "Left Group",
      value: studentComparisonFilters.leftGroup,
      options: groupOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({
          ...prev,
          leftGroup: value,
          leftStudent: getDefaultStudentIdForGroup(MOCK_INSTRUCTOR_ANALYTICS, value, prev.leftStudent),
        })),
      icon: <Groups2OutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "student-comparison-left",
      label: "Left Student",
      value: studentComparisonFilters.leftStudent,
      options: leftStudentOptions,
      onChange: (value) => setStudentComparisonFilters((prev) => ({ ...prev, leftStudent: value })),
      icon: <PersonOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "student-comparison-right-contest",
      label: "Right Contest",
      value: studentComparisonFilters.rightContest,
      options: contestOptions,
      onChange: (value) => setStudentComparisonFilters((prev) => ({ ...prev, rightContest: value })),
      icon: <EmojiEventsOutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "student-comparison-right-group",
      label: "Right Group",
      value: studentComparisonFilters.rightGroup,
      options: groupOptions,
      onChange: (value) =>
        setStudentComparisonFilters((prev) => ({
          ...prev,
          rightGroup: value,
          rightStudent: getDefaultStudentIdForGroup(MOCK_INSTRUCTOR_ANALYTICS, value, prev.rightStudent),
        })),
      icon: <Groups2OutlinedIcon className={sectionFilterIconClassName} />,
    },
    {
      id: "student-comparison-right-student",
      label: "Right Student",
      value: studentComparisonFilters.rightStudent,
      options: rightStudentOptions,
      onChange: (value) => setStudentComparisonFilters((prev) => ({ ...prev, rightStudent: value })),
      icon: <PersonOutlinedIcon className={sectionFilterIconClassName} />,
    },
  ];

  return {
    activeAiHintTrend,
    activeGamificationTrend,
    contestComparisonFields,
    contestComparisonRows,
    groupComparisonFields,
    groupComparisonRows,
    hintDateRange,
    leftContestLabel,
    leftGroupComparisonContestLabel,
    leftGroupLabel,
    leftStudentContestLabel,
    leftStudentLabel,
    liveAnalyticsData,
    liveSelectedContestId,
    liveViewMode,
    rightContestLabel,
    rightGroupComparisonContestLabel,
    rightGroupLabel,
    rightStudentContestLabel,
    rightStudentLabel,
    setHintDateRange,
    setLiveSelectedContestId,
    setLiveViewMode,
    setGamificationDateRange,
    studentComparisonFields,
    studentComparisonFilters,
    studentComparisonRows,
    gamificationDateRange,
  };
}
