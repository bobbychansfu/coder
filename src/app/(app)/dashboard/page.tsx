import { redirect } from "next/navigation";
import DashboardPage from "@/fe/dashboard/page/DashboardPage";
import InstructorDashboardPage from "@/fe/dashboard/page/InstructorDashboardPage";
import { getStudentContestInfo } from "@/fe/contests/services/contestApi";
import { mapStudentDashboardContests } from "@/fe/dashboard/services/dashboardContests";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardRoute() {
  const user = await getCurrentUser();

  if (user?.role === "instructor") {
    return <InstructorDashboardPage />;
  }
  if (user?.role === "admin") {
    redirect("/admin");
  }
  if (user?.role === "ta") {
    redirect(can(user.role).canAccessInstructorArea ? "/instructor" : "/403");
  }

  const contestInfoResponse = await getStudentContestInfo();
  const contestSummary =
    contestInfoResponse.ok && contestInfoResponse.data
      ? mapStudentDashboardContests(contestInfoResponse.data)
      : undefined;

  return <DashboardPage contestSummary={contestSummary} />;
}
