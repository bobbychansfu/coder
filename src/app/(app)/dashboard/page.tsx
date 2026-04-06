import AdminDashboardPage from "@/fe/dashboard/page/AdminDashboardPage";
import DashboardPage from "@/fe/dashboard/page/DashboardPage";
import InstructorDashboardPage from "@/fe/dashboard/page/InstructorDashboardPage";
import {
  mapStudentDashboardContests,
  type StudentDashboardContestSummary,
} from "@/fe/dashboard/services/dashboardContests";
import { redirect } from "next/navigation";
import { getStudentContestInfoPayload } from "@/server/api/s/studentContestInfo";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    return <AdminDashboardPage />;
  }

  if (user.role === "instructor") {
    return <InstructorDashboardPage />;
  }

  let contestSummary: StudentDashboardContestSummary | undefined;

  try {
    contestSummary = mapStudentDashboardContests(await getStudentContestInfoPayload(user));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server-side data load error.";

    console.error("[dashboard:ssr] failed direct contest load", {
      computingId: user.computingId,
      role: user.role,
      errorMessage: message,
    });
  }

  return <DashboardPage contestSummary={contestSummary} />;
}
