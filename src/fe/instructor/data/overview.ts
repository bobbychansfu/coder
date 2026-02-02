export type OverviewTone = "contests" | "participants" | "problems";

export interface OverviewStat {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: OverviewTone;
}

export const overviewStats: OverviewStat[] = [
  {
    id: "active-contests",
    label: "Active Contests",
    value: "3",
    caption: "2 ongoing, 1 upcoming",
    tone: "contests",
  },
  {
    id: "total-participants",
    label: "Total Participants",
    value: "147",
    caption: "Across all contests",
    tone: "participants",
  },
  {
    id: "problems-created",
    label: "Problems Created",
    value: "28",
    caption: "12 this semester",
    tone: "problems",
  },
];
