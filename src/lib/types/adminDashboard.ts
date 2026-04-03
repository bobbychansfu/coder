import type { ActivityItemData } from "@/fe/shared/types/common";
import type { UpcomingContest } from "@/fe/shared/types/contest";
import type { Statistic } from "@/fe/shared/types/statistics";

export interface AdminDashboardContestItem {
  id: string;
  title: string;
  owner: string;
  date: string;
  status: "Draft" | "Upcoming" | "Active" | "Ended";
  visibility: "Public" | "Private" | "Course Only";
  participants: number;
  problemsCount: number;
  announcementsCount: number;
  published: boolean;
}

export interface AdminDashboardSnapshot {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export interface AdminDashboardData {
  statistics: Statistic[];
  schedule: UpcomingContest[];
  contests: AdminDashboardContestItem[];
  activity: ActivityItemData[];
  snapshots: AdminDashboardSnapshot[];
}
