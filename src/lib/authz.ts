export type Role = "student" | "ta" | "instructor" | "admin";

const ROLE_LEVEL: Record<Role, number> = {
  student: 0,
  ta: 1,
  instructor: 2,
  admin: 3,
};

function readBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const ALLOW_TA_CREATE = readBooleanFlag(process.env.ALLOW_TA_CREATE);
export const ALLOW_TA_INSTRUCTOR_AREA = readBooleanFlag(
  process.env.ALLOW_TA_INSTRUCTOR_AREA,
);
export const ALLOW_TA_INSTRUCTOR_ACTIONS = readBooleanFlag(
  process.env.ALLOW_TA_INSTRUCTOR_ACTIONS ?? process.env.ALLOW_TA_CREATE,
);

export function isRole(value: unknown): value is Role {
  return (
    value === "student" ||
    value === "ta" ||
    value === "instructor" ||
    value === "admin"
  );
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
  const isTa = role === "ta";

  const showDashboardTab = true;
  const showContestsTab = true;
  const showPracticeTab = true;
  const showInstructorTab = isAdmin || isInstructor || (ALLOW_TA_INSTRUCTOR_AREA && isTa);
  const showAdminTab = isAdmin;

  const instructorActionAllowed =
    isAdmin || isInstructor || (ALLOW_TA_INSTRUCTOR_ACTIONS && isTa);

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
