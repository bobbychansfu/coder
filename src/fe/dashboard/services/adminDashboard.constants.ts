import type { AdminDashboardData } from "@/lib/types/adminDashboard";

export const ADMIN_DASHBOARD_STALE_TIME_MS = 30000;

export const EMPTY_ADMIN_DASHBOARD_DATA: AdminDashboardData = {
  statistics: [],
  schedule: [],
  contests: [],
  activity: [],
  snapshots: [],
};
