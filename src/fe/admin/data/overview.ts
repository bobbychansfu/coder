export type AdminOverviewTone =
  | "users"
  | "courses"
  | "problems"
  | "health";

export interface AdminOverviewStat {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: AdminOverviewTone;
  accent?: "positive" | "neutral";
}

export const adminOverviewStats: AdminOverviewStat[] = [
  {
    id: "total-users",
    label: "Total Users",
    value: "2,847",
    caption: "+124 this month",
    tone: "users",
    accent: "positive",
  },
  {
    id: "active-courses",
    label: "Active Courses",
    value: "45",
    caption: "12 starting soon",
    tone: "courses",
    accent: "neutral",
  },
  {
    id: "problems",
    label: "Problems",
    value: "1,256",
    caption: "328 public",
    tone: "problems",
    accent: "neutral",
  },
  {
    id: "system-health",
    label: "System Health",
    value: "99.8%",
    caption: "Uptime",
    tone: "health",
    accent: "positive",
  },
];
