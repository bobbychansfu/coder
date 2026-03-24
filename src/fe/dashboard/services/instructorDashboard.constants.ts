import type { InstructorDashboardData } from "@/lib/types/instructorDashboard";

export const INSTRUCTOR_DASHBOARD_STALE_TIME_MS = 30000;

export const EMPTY_INSTRUCTOR_DASHBOARD_DATA: InstructorDashboardData = {
  statistics: [],
  schedule: [],
  contests: [],
  announcements: [],
  snapshots: [],
};
