import type { StudentDashboardMetadata } from "@/lib/types/dashboardMetadata";
import type { StudentDashboardMetadataResponse } from "@/lib/trpc/types/dashboardMetadata";
import { DASHBOARD_BADGE_VISUALS, DASHBOARD_STAT_ICONS } from "./dashboardMetadata.constants";

export function mapStudentDashboardMetadata(
  payload: StudentDashboardMetadataResponse,
): StudentDashboardMetadata {
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
        icon: DASHBOARD_STAT_ICONS.participation,
        variant: "neutral",
        tone: "info",
      },
      {
        title: "Total score",
        value: payload.cards.totalScore.toLocaleString(),
        subtitle: `Points rank #${payload.cards.rankPointsNumber ?? "-"}`,
        icon: DASHBOARD_STAT_ICONS.totalScore,
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
      const visuals = DASHBOARD_BADGE_VISUALS[badge.code] ?? { icon: "🏅", color: "#475467" };
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
