export type AdminActivityTone = "danger" | "warning" | "info" | "success";

export interface AdminActivityItem {
  id: string;
  description: string;
  timestamp: string;
  tone: AdminActivityTone;
}

export const adminRecentActivity: AdminActivityItem[] = [
  {
    id: "activity-1",
    description: "New instructor account created: Dr. Sarah Johnson",
    timestamp: "1 hour ago",
    tone: "danger",
  },
  {
    id: "activity-2",
    description: "Course \"Advanced Algorithms\" approved and published",
    timestamp: "3 hours ago",
    tone: "warning",
  },
  {
    id: "activity-3",
    description: "System maintenance scheduled for Jan 25, 2026",
    timestamp: "5 hours ago",
    tone: "info",
  },
  {
    id: "activity-4",
    description: "Database backup completed successfully",
    timestamp: "1 day ago",
    tone: "success",
  },
];
