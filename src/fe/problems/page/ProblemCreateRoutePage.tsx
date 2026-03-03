import { redirect } from "next/navigation";
import InstructorCreateProblemPage from "@/fe/instructor/page/InstructorCreateProblemPage";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function ProblemCreateRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!can(user.role).canCreateProblem) {
    redirect("/403");
  }

  return <InstructorCreateProblemPage />;
}
