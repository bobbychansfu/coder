import type { ReactNode } from "react";
import { AppShell } from "@/fe/shared";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
