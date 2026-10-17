import { redirect } from "next/navigation";
import InstructorCreateProblemPage from "@/fe/instructor/page/InstructorCreateProblemPage";
import { can } from "@/lib/authz";
import { loginPath } from "@/lib/loginPath";
import { getCurrentUser } from "@/lib/session";

export default async function ProblemCreateRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(await loginPath());
  }

  if (!can(user.role).canCreateProblem) {
    redirect("/403");
  }

  return <InstructorCreateProblemPage />;
}
