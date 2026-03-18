import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { mockBadges } from "@/fe/dashboard/data/badges";
import { mockStatistics } from "@/fe/dashboard/data/statistics";
import { mockWeeklyStats } from "@/fe/dashboard/data/weeklyStats";
import type { StudentDashboardMetadata } from "@/lib/types/dashboardMetadata";

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

export const DASHBOARD_BADGE_VISUALS: Record<string, { icon: string; color: string }> = {
  "first-submission": { icon: "🚀", color: "#2563eb" },
  "first-accepted": { icon: "✅", color: "#059669" },
  "active-learner": { icon: "🧠", color: "#7c3aed" },
  "consistent-week": { icon: "📅", color: "#0891b2" },
  "login-streak-3": { icon: "☀️", color: "#f59e0b" },
  "login-streak-7": { icon: "🔥", color: "#ea580c" },
};

export const DASHBOARD_STAT_ICONS = {
  participation: GroupsOutlinedIcon,
  totalScore: WorkspacePremiumOutlinedIcon,
} as const;
