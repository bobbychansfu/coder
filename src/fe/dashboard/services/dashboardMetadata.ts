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

export function getStudentDashboardMetadata(): StudentDashboardMetadata {
  return STUDENT_DASHBOARD_METADATA;
}
