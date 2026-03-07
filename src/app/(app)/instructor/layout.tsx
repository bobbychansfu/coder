import type { ReactNode } from "react";
import { ALLOW_TA_INSTRUCTOR_AREA, type Role } from "@/lib/authz";
import { requireRole } from "@/lib/requireRole";

interface InstructorLayoutProps {
  children: ReactNode;
}

export default async function InstructorLayout({ children }: InstructorLayoutProps) {
  const allowedRoles: Role[] = ALLOW_TA_INSTRUCTOR_AREA
    ? ["ta", "instructor", "admin"]
    : ["instructor", "admin"];

  await requireRole(allowedRoles);

  return <>{children}</>;
}
