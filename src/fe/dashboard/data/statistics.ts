import { Statistic } from "@/fe/shared/types";

export const mockStatistics: Statistic[] = [
  {
    title: "Total Solved",
    value: "38",
    subtitle: "+5 this week",
    icon: "/icons/trophy.svg",
    variant: "success",
  },
  {
    title: "Current Streak",
    value: "12 days",
    subtitle: "Keep it up!",
    icon: "/icons/flame.svg",
    variant: "neutral",
  },
  {
    title: "Total XP",
    value: "8,450",
    subtitle: "Level 14",
    icon: "/icons/star.svg",
    variant: "neutral",
  },
  {
    title: "Global Rank",
    value: "#2,847",
    subtitle: "↑ 124 this month",
    icon: "/icons/target.svg",
    variant: "success",
  },
];
