export type AdminActionTone = "danger" | "warning" | "info";

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  tone: AdminActionTone;
}

export const adminActions: AdminAction[] = [
  {
    id: "user-management",
    title: "User Management",
    description: "Manage users, roles, permissions, and access control",
    tone: "danger",
  },
  {
    id: "course-management",
    title: "Course Management",
    description: "Oversee all courses, instructors, and course settings",
    tone: "warning",
  },
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure platform settings, integrations, and features",
    tone: "info",
  },
];
