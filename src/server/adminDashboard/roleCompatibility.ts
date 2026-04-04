export type PersistedAdminDashboardRole = string | null | undefined;

export type AdminDashboardRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

// Treat every non-student, non-admin teaching role as "Instructor" for dashboard display.
export const NON_INSTRUCTOR_DASHBOARD_ROLES = ["STUDENT", "ADMIN"] as const;

export function normalizeAdminDashboardRole(
  role: PersistedAdminDashboardRole,
): AdminDashboardRole {
  if (role === "ADMIN") {
    return "ADMIN";
  }

  if (role === "STUDENT") {
    return "STUDENT";
  }

  return "INSTRUCTOR";
}
