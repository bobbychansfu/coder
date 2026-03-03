import { redirect } from "next/navigation";
import ProblemsPage from "@/fe/problems/page/ProblemsPage";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function ProblemsRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ProblemsPage showCreateProblem={can(user.role).canCreateProblem} />;
}
