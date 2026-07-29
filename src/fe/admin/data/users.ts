import type { Role } from "@/lib/authz";

export type AdminUserRole = Role;

export interface AdminUserRecord {
  id: string;
  computingId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AdminUserRole;
  databaseRole: "ADMIN" | "INSTRUCTOR" | "TA" | "STUDENT";
  nickname: string | null;
  studentNumber: string | null;
  pointsAcquired: number;
  problemsSolved: number;
  competitionsParticipated: number;
  rank: string | null;
  isCurrentUser: boolean;
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
  { value: "instructor", label: "Instructor" },
  { value: "admin", label: "Admin" },
];
