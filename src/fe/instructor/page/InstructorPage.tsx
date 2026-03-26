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
  type InstructorActionTone,
  type ActivityTone,
} from "@/fe/instructor/data";
import { trpc } from "@/lib/trpc/client";

// Icon mappings for instructor action cards
const actionIconMap: Record<InstructorActionTone, SvgIconComponent> = {
  success: NotificationsNoneOutlinedIcon,
  info: BarChartOutlinedIcon,
  purple: CreateOutlinedIcon,
  warning: EmojiEventsOutlinedIcon,
};

// Icon mappings for instructor activity items
const activityToneIconMap: Record<ActivityTone, SvgIconComponent> = {
  success: DescriptionOutlinedIcon,
  info: TrendingUpOutlinedIcon,
  highlight: GroupAddOutlinedIcon,
};

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
}

function getActivityDescription(
  type: "problem" | "contest",
  title: string,
  status: string,
): string {
  if (type === "problem") {
    if (status === "draft") return `Problem "${title}" saved as draft`;
    if (status === "archived") return `Problem "${title}" archived`;
    if (status === "deleted") return `Problem "${title}" deleted`;
    return `Problem "${title}" published`;
  }
  if (status === "draft") return `Contest "${title}" saved as draft`;
  if (status === "archived") return `Contest "${title}" archived`;
  if (status === "deleted") return `Contest "${title}" deleted`;
  if (status === "upcoming") return `Contest "${title}" scheduled`;
  if (status === "active") return `Contest "${title}" is now active`;
  return `Contest "${title}" updated`;
}

function getActivityTone(status: string): ActivityTone {
  if (status === "archived" || status === "deleted" || status === "draft") return "info";
  return "success";
}

export default function InstructorPage() {
  const router = useRouter();

  const overviewQuery = trpc.instructorManageContent.getInstructorOverview.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

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

  const activeContests = overviewQuery.data?.activeContestsCount ?? 0;
  const problemsCreated = overviewQuery.data?.problemsCreatedCount ?? 0;

  const stats: StatCardData[] = [
    {
      id: "active-contests",
      label: "Active Contests",
      value: overviewQuery.isLoading ? "—" : String(activeContests),
      caption:
        activeContests === 0
          ? "No active contests"
          : `${activeContests} contest${activeContests === 1 ? "" : "s"} currently in progress`,
      tone: "contests",
      icon: EmojiEventsOutlinedIcon,
    },
    {
      id: "total-participants",
      label: "Total Participants",
      value: "147",
      caption: "Across all contests",
      tone: "participants",
      icon: GroupOutlinedIcon,
    },
    {
      id: "problems-created",
      label: "Problems Created",
      value: overviewQuery.isLoading ? "—" : String(problemsCreated),
      caption:
        problemsCreated === 0
          ? "No problems yet"
          : `${problemsCreated} problem${problemsCreated === 1 ? "" : "s"} in your library`,
      tone: "problems",
      icon: FactCheckOutlinedIcon,
    },
  ];

  const recentItems = overviewQuery.data?.recentActivity ?? [];
  const activity: ActivityItemData[] =
    recentItems.length > 0
      ? recentItems.map((item) => {
          const tone = getActivityTone(item.status);
          return {
            id: item.id,
            description: getActivityDescription(item.type, item.title, item.status),
            timestamp: formatRelativeTime(item.updatedAt),
            tone,
            icon: activityToneIconMap[tone],
          };
        })
      : [
          {
            id: "empty",
            description: "No recent activity. Create a problem or contest to get started.",
            timestamp: "",
            tone: "info" as ActivityTone,
            icon: activityToneIconMap["info"],
          },
        ];

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
