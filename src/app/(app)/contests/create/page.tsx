import ContestCreateRoutePage from "@/fe/contests/page/ContestCreateRoutePage";
import { ALLOW_TA_INSTRUCTOR_ACTIONS, type Role } from "@/lib/authz";
import { requireRole } from "@/lib/requireRole";

export default async function ContestCreatePage() {
  const allowedRoles: Role[] = ALLOW_TA_INSTRUCTOR_ACTIONS
    ? ["ta", "instructor", "admin"]
    : ["instructor", "admin"];

  await requireRole(allowedRoles);

  return <ContestCreateRoutePage />;
}
