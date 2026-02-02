export type AdminOverviewTone =
  | "users"
  | "contests"
  | "problems"
  | "health";

export interface AdminOverviewStat {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: AdminOverviewTone;
  valueAccent?: "positive" | "neutral";
  captionAccent?: "positive" | "neutral";
}

export const adminOverviewStats: AdminOverviewStat[] = [
  {
    id: "total-users",
    label: "Total Users",
    value: "2,847",
    caption: "+124 this month",
    tone: "users",
    captionAccent: "positive",
  },
  {
    id: "total-contests",
    label: "Total Contests",
    value: "45",
    caption: "3 active now",
    tone: "contests",
  },
  {
    id: "problems",
    label: "Problems",
    value: "1,256",
    caption: "328 public",
    tone: "problems",
  },
  {
    id: "system-health",
    label: "System Health",
    value: "99.8%",
    caption: "Uptime",
    tone: "health",
    valueAccent: "positive",
  },
];
