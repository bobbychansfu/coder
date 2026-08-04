import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/fe/shared/components/layout/AppShell";
import { getCurrentUser } from "@/lib/session";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user = {user}>{children}</AppShell>;
}
