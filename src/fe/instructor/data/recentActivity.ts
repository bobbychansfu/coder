export type ActivityTone = "success" | "info" | "highlight";

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  tone: ActivityTone;
}

export const recentActivity: ActivityItem[] = [
  {
    id: "activity-1",
    description: 'New problem "Binary Search Tree" published',
    timestamp: "2 hours ago",
    tone: "success",
  },
  {
    id: "activity-2",
    description: "CS 201 avg submission rate increased by 15%",
    timestamp: "1 day ago",
    tone: "info",
  },
  {
    id: "activity-3",
    description: "8 new students enrolled in CS 301",
    timestamp: "3 days ago",
    tone: "highlight",
  },
];
