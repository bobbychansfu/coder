import type { Role } from "@/lib/authz";

export type AdminUserRole = Role | "guest";

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  courses: number;
  lastActive: string;
}

export interface AdminUserRoleOption {
  value: "all" | AdminUserRole;
  label: string;
}

export const adminRoleOptions: AdminUserRoleOption[] = [
  { value: "all", label: "All Roles" },
  { value: "student", label: "Student" },
  { value: "guest", label: "Guest" },
  { value: "instructor", label: "Instructor" },
  { value: "admin", label: "Admin" },
];

export const adminUsers: AdminUserRecord[] = [
  {
    id: "user-alex-chen",
    name: "Alex Chen",
    email: "alex.chen@sfu.ca",
    role: "student",
    courses: 3,
    lastActive: "2 hours ago",
  },
  {
    id: "user-sarah-johnson",
    name: "Dr. Sarah Johnson",
    email: "sarah.j@sfu.ca",
    role: "instructor",
    courses: 2,
    lastActive: "1 hour ago",
  },
  {
    id: "user-emma-wilson",
    name: "Emma Wilson",
    email: "emma.w@sfu.ca",
    role: "student",
    courses: 2,
    lastActive: "3 hours ago",
  },
  {
    id: "user-michael-chen",
    name: "Prof. Michael Chen",
    email: "michael.c@sfu.ca",
    role: "instructor",
    courses: 1,
    lastActive: "30 min ago",
  },
  {
    id: "user-admin",
    name: "Admin User",
    email: "admin@sfu.ca",
    role: "admin",
    courses: 0,
    lastActive: "5 min ago",
  },
];
