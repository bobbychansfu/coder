import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/fe/shared/components/layout/AppShell";
import { getCurrentUser } from "@/lib/session";
import { TrpcProvider } from "@/lib/trpc/provider";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <TrpcProvider>
      <AppShell user={user}>{children}</AppShell>
    </TrpcProvider>
  );
}
