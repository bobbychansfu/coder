import ContestCreateRoutePage from "@/fe/contests/page/ContestCreateRoutePage";
import type { Role } from "@/lib/authz";
import { requireRole } from "@/lib/requireRole";

export default async function ContestCreatePage() {
  const allowedRoles: Role[] = ["instructor", "admin"];

  await requireRole(allowedRoles);

  return <ContestCreateRoutePage />;
}
