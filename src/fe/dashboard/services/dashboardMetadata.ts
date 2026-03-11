import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { mockBadges } from "@/fe/dashboard/data/badges";
import { mockStatistics } from "@/fe/dashboard/data/statistics";
import { mockWeeklyStats } from "@/fe/dashboard/data/weeklyStats";
import type { StudentDashboardMetadata } from "@/lib/types/dashboardMetadata";
import type { StudentDashboardMetadataResponse } from "@/lib/trpc/types/dashboardMetadata";
import { trpc } from "@/lib/trpc/client";

const STUDENT_WEEKLY_STATS = mockWeeklyStats.map((stat) =>
  stat.label === "XP Earned" ? { ...stat, label: "Score Earned" } : stat,
);

export const STUDENT_DASHBOARD_METADATA: StudentDashboardMetadata = {
  statistics: mockStatistics,
  weeklyStats: STUDENT_WEEKLY_STATS,
  badges: mockBadges,
};

export const EMPTY_STUDENT_DASHBOARD_METADATA: StudentDashboardMetadata = {
  statistics: [],
  weeklyStats: [],
  badges: [],
};

export function getStudentDashboardMetadata(): StudentDashboardMetadata {
  return STUDENT_DASHBOARD_METADATA;
}

const BADGE_VISUALS: Record<string, { icon: string; color: string }> = {
  "first-submission": { icon: "🚀", color: "#2563eb" },
  "first-accepted": { icon: "✅", color: "#059669" },
  "active-learner": { icon: "🧠", color: "#7c3aed" },
  "consistent-week": { icon: "📅", color: "#0891b2" },
  "3-day-login-streak": { icon: "☀️", color: "#f59e0b" },
  "7-day-login-streak": { icon: "🔥", color: "#ea580c" },
};

function mapMetadata(payload: StudentDashboardMetadataResponse): StudentDashboardMetadata {
  return {
    statistics: [
      {
        title: "Total Solved",
        value: String(payload.cards.totalSolved),
        subtitle: `${payload.participation.activeDays7d} active days in 7d`,
        icon: "/icons/trophy.svg",
        variant: "success",
      },
      {
        title: "Participation",
        value: `${payload.cards.participationContests} contests`,
        subtitle: `${payload.participation.submissions7d} submissions in 7d`,
        icon: GroupsOutlinedIcon,
        variant: "neutral",
        tone: "info",
      },
      {
        title: "Total score",
        value: payload.cards.totalScore.toLocaleString(),
        subtitle: `Points rank #${payload.cards.rankPointsNumber ?? "-"}`,
        icon: WorkspacePremiumOutlinedIcon,
        variant: "neutral",
        tone: "highlight",
      },
      {
        title: "Global Rank",
        value: payload.cards.rankParticipationNumber ? `#${payload.cards.rankParticipationNumber}` : "-",
        subtitle: `${payload.participation.loginStreakDays}d login streak`,
        icon: "/icons/target.svg",
        variant: "success",
      },
    ],
    weeklyStats: [
      { label: "Problems Solved", value: payload.weekly.problemsSolved7d },
      { label: "Contests Participated", value: payload.weekly.contestsParticipated7d },
      {
        label: "Score Earned",
        value: `+${payload.weekly.points7d}`,
        isPositive: payload.weekly.points7d > 0,
      },
      { label: "Time Spent", value: `${(payload.weekly.timeSpentMinutes7d / 60).toFixed(1)}h` },
    ],
    badges: payload.badges.earned.slice(0, 3).map((badge) => {
      const visuals = BADGE_VISUALS[badge.code] ?? { icon: "🏅", color: "#475467" };
      return {
        id: badge.code,
        name: badge.name,
        icon: visuals.icon,
        color: visuals.color,
        earnedDate: badge.earnedAt ?? undefined,
      };
    }),
  };
}

export function useStudentDashboardMetadata(): {
  metadata: StudentDashboardMetadata | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = trpc.dashboardMetadata.getStudent.useQuery(undefined, {
    staleTime: 30000,
  });

  return {
    metadata: data ? mapMetadata(data) : undefined,
    isLoading,
    isError,
  };
}
