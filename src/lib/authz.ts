export type Role = "student" | "instructor" | "admin";

const ROLE_LEVEL: Record<Role, number> = {
  student: 0,
  instructor: 1,
  admin: 2,
}

export function isRole(value: unknown): value is Role {
  return value === "student" || value === "instructor" || value === "admin";
}

export function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  return isRole(normalized) ? normalized : null;
}

export function hasMinRole(role: Role, minimumRole: Role): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimumRole];
}

export function can(role: Role) {
  const isAdmin = role === "admin";
  const isInstructor = role === "instructor";

  const showDashboardTab = true;
  const showContestsTab = true;
  const showPracticeTab = true;
  const showInstructorTab = isAdmin || isInstructor;
  const showAdminTab = isAdmin;

  const instructorActionAllowed = isAdmin || isInstructor;

  const canCreateContest = instructorActionAllowed;
  const canManageContest = instructorActionAllowed;
  const canViewAllSubmissions = instructorActionAllowed;
  const canCreateProblem = instructorActionAllowed;

  return {
    showDashboardTab,
    showContestsTab,
    showPracticeTab,
    showInstructorTab,
    showAdminTab,
    canCreateContest,
    canManageContest,
    canViewAllSubmissions,
    canCreateProblem,
    // Backward-compatible aliases for existing guards.
    canAccessInstructorArea: showInstructorTab,
    canAccessAdminArea: showAdminTab,
  };
}
