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
    description: "Contest \"CMPT 307 Midterm\" created by Dr. Johnson",
    timestamp: "3 hours ago",
    tone: "warning",
  },
  {
    id: "activity-3",
    description: "System maintenance scheduled for Feb 8, 2026",
    timestamp: "5 hours ago",
    tone: "info",
  },
  {
    id: "activity-4",
    description: "Database backup completed successfully",
    timestamp: "1 day ago",
    tone: "success",
  },
  {
    id: "activity-5",
    description: "New student cohort added: Spring 2026",
    timestamp: "2 days ago",
    tone: "danger",
  },
  {
    id: "activity-6",
    description: "Contest \"Data Structures Sprint\" archived",
    timestamp: "2 days ago",
    tone: "warning",
  },
  {
    id: "activity-7",
    description: "System configuration updated: Email provider",
    timestamp: "3 days ago",
    tone: "info",
  },
  {
    id: "activity-8",
    description: "Database backup completed successfully",
    timestamp: "4 days ago",
    tone: "success",
  },
  {
    id: "activity-9",
    description: "New instructor account created: Prof. Lee",
    timestamp: "5 days ago",
    tone: "danger",
  },
  {
    id: "activity-10",
    description: "Contest \"Algorithm Warmup\" created by Prof. Lee",
    timestamp: "6 days ago",
    tone: "warning",
  },
];
