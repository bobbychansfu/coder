export type OverviewTone = "courses" | "students" | "problems";

export interface OverviewStat {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: OverviewTone;
}

export const overviewStats: OverviewStat[] = [
  {
    id: "active-courses",
    label: "Active Courses",
    value: "3",
    caption: "2 ongoing, 1 upcoming",
    tone: "courses",
  },
  {
    id: "total-students",
    label: "Total Students",
    value: "147",
    caption: "Across all courses",
    tone: "students",
  },
  {
    id: "problems-created",
    label: "Problems Created",
    value: "28",
    caption: "12 this semester",
    tone: "problems",
  },
];
