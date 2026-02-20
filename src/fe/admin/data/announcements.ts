import type { ManagedAnnouncementItem } from "@/fe/shared/components/announcements/AnnouncementManagementListCard";

export interface AdminAnnouncementStat {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export const adminAnnouncementStats: AdminAnnouncementStat[] = [
  {
    id: "total-announcements",
    label: "Total Announcements",
    value: "12",
    caption: "4 active",
  },
  {
    id: "total-views",
    label: "Total Views",
    value: "18,247",
    caption: "Last 30 days",
  },
  {
    id: "avg-reach",
    label: "Avg Reach",
    value: "89%",
    caption: "Of all users",
  },
];

export const adminAnnouncementHistory: ManagedAnnouncementItem[] = [
  {
    id: "platform-announcement-1",
    status: "active",
    author: "By System\nAdmin",
    message:
      "Scheduled maintenance: Platform will be down for maintenance on Sunday, Feb 8th from 2:00 AM to 4:00 AM PST.",
    timeAgo: "2 hours ago",
    views: 1247,
  },
  {
    id: "platform-announcement-2",
    status: "active",
    author: "By Admin\nTeam",
    message:
      "New Feature: Algorithmic complexity requirements are now available for all problems. Check out the updated problem authoring page!",
    timeAgo: "1 day ago",
    views: 2145,
  },
  {
    id: "platform-announcement-3",
    status: "inactive",
    author: "By System\nAdmin",
    message:
      "Reminder: All students must complete their profile information by end of week.",
    timeAgo: "3 days ago",
    views: 1893,
  },
  {
    id: "platform-announcement-4",
    status: "inactive",
    author: "By Admin\nTeam",
    message:
      "Contest registration for Spring 2026 competitions is now open! Visit the contests page to enroll.",
    timeAgo: "1 week ago",
    views: 3421,
  },
];
