export interface AdminDashboardRoleSummary {
  students: number;
  instructors: number;
  admins: number;
}

export function formatAdminRoleSummaryLines(summary: AdminDashboardRoleSummary): string {
  return `student: ${summary.students}\ninstructor: ${summary.instructors}\nadmin: ${summary.admins}`;
}
