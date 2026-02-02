export type AdminActionTone = "success" | "danger" | "warning" | "info";

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  tone: AdminActionTone;
}

export const adminActions: AdminAction[] = [
  {
    id: "announcements",
    title: "Announcements",
    description: "Send and manage platform-wide announcements to all users",
    tone: "success",
  },
  {
    id: "user-management",
    title: "User Management",
    description: "Manage users, roles, permissions, and access control",
    tone: "danger",
  },
  {
    id: "contest-management",
    title: "Contest Management",
    description: "Oversee all contests, schedules, and contest settings",
    tone: "warning",
  },
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure platform settings, integrations, and features",
    tone: "info",
  },
];
