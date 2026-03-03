import { redirect } from "next/navigation";
import InstructorCreateContestPage from "@/fe/instructor/page/InstructorCreateContestPage";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function ContestCreateRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!can(user.role).canCreateContest) {
    redirect("/403");
  }

  return <InstructorCreateContestPage />;
}
