import type { ReactNode } from "react";
import { requireRole } from "@/lib/requireRole";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole(["admin"]);

  return <>{children}</>;
}
