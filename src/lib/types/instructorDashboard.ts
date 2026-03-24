import type { ActivityItemData } from "@/fe/shared/types/common";
import type { Statistic } from "@/fe/shared/types/statistics";

export interface InstructorDashboardScheduleItem {
  id: string;
  title: string;
  date: string;
  timeUntil: string;
  status: "Draft" | "Upcoming" | "Active";
  readinessState: "Ready" | "Needs Attention" | "Blocked";
}

export interface InstructorDashboardContestItem {
  id: string;
  title: string;
  date: string;
  status: "Draft" | "Upcoming" | "Active" | "Ended";
  participants: number;
  problemsCount: number;
  groupsAssignedCount: number;
  aiHintEnabled: boolean;
}

export interface InstructorDashboardSnapshot {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export interface InstructorDashboardData {
  statistics: Statistic[];
  schedule: InstructorDashboardScheduleItem[];
  contests: InstructorDashboardContestItem[];
  announcements: ActivityItemData[];
  snapshots: InstructorDashboardSnapshot[];
}
