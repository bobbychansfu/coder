import AdminDashboardPage from "@/fe/dashboard/page/AdminDashboardPage";
import DashboardPage from "@/fe/dashboard/page/DashboardPage";
import InstructorDashboardPage from "@/fe/dashboard/page/InstructorDashboardPage";
import { getStudentContestInfo } from "@/fe/contests/services/contestApi";
import { mapStudentDashboardContests } from "@/fe/dashboard/services/dashboardContests";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardRoute() {
  const user = await getCurrentUser();

  if (user?.role === "admin") {
    return <AdminDashboardPage />;
  }

  if (user?.role === "instructor") {
    return <InstructorDashboardPage />;
  }

  const contestInfoResponse = await getStudentContestInfo();
  const contestSummary =
    contestInfoResponse.ok && contestInfoResponse.data
      ? mapStudentDashboardContests(contestInfoResponse.data)
      : undefined;

  return <DashboardPage contestSummary={contestSummary} />;
}
