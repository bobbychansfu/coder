import DashboardPage from "@/fe/dashboard/page/DashboardPage";
import InstructorDashboardPage from "@/fe/dashboard/page/InstructorDashboardPage";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardRoute() {
  const user = await getCurrentUser();

  if (user?.role === "instructor") {
    return <InstructorDashboardPage />;
  }

  return <DashboardPage />;
}
