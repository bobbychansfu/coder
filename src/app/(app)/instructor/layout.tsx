import type { ReactNode } from "react";
import type { Role } from "@/lib/authz";
import { requireRole } from "@/lib/requireRole";

interface InstructorLayoutProps {
  children: ReactNode;
}

export default async function InstructorLayout({ children }: InstructorLayoutProps) {
  const allowedRoles: Role[] = ["instructor", "admin"];

  await requireRole(allowedRoles);

  return <>{children}</>;
}
