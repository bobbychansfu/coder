"use client";

import { useRouter } from "next/navigation";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

import ManagementLayout from "@/fe/shared/components/layout/ManagementLayout";
import type { ActivityItemData, StatCardData, ToolCardData } from "@/fe/shared/types/common";
import { ROUTES } from "@/fe/shared/constants/routes";
import {
  instructorActions,
  overviewStats,
  recentActivity,
  type InstructorActionTone,
  type OverviewTone,
  type ActivityTone,
} from "@/fe/instructor/data";

// Icon mappings for instructor action cards
const actionIconMap: Record<InstructorActionTone, SvgIconComponent> = {
  success: NotificationsNoneOutlinedIcon,
  info: BarChartOutlinedIcon,
  purple: CreateOutlinedIcon,
  warning: EmojiEventsOutlinedIcon,
};

// Icon mappings for instructor overview cards
const overviewIconMap: Record<OverviewTone, SvgIconComponent> = {
  contests: EmojiEventsOutlinedIcon,
  participants: GroupOutlinedIcon,
  problems: FactCheckOutlinedIcon,
};

// Icon mappings for instructor activity items
const activityIconMap: Record<ActivityTone, SvgIconComponent> = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
};

export default function InstructorPage() {
  const router = useRouter();

  // Map instructor data to DashboardPage format
  const actions: ToolCardData[] = instructorActions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    tone: action.tone,
    icon: actionIconMap[action.tone],
    onClick:
      action.id === "manage-contests"
        ? () => router.push(ROUTES.instructorManageContests)
        : action.id === "research-analytics"
          ? () => router.push(ROUTES.instructorResearchAnalytics)
          : action.id === "create-problem"
            ? () => router.push(ROUTES.instructorCreateProblem)
            : action.id === "create-contest"
              ? () => router.push(ROUTES.instructorCreateContest)
        : undefined,
  }));

  const stats: StatCardData[] = overviewStats.map((stat) => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    caption: stat.caption,
    tone: stat.tone,
    icon: overviewIconMap[stat.tone],
  }));

  const activity: ActivityItemData[] = recentActivity.map((item) => ({
    id: item.id,
    description: item.description,
    timestamp: item.timestamp,
    tone: item.tone,
    icon: activityIconMap[item.tone],
  }));

  return (
    <ManagementLayout
      title="Instructor Tools"
      subtitle="Manage your courses, create problems, and track student progress"
      headerIcon={SchoolOutlinedIcon}
      headerIconColor="red"
      actions={actions}
      stats={stats}
      activity={activity}
    />
  );
}
