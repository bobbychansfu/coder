import { redirect } from "next/navigation";
import PracticePage from "@/fe/practice/page/PracticePage";
import { can } from "@/lib/authz";
import { getCurrentUser } from "@/lib/session";

export default async function PracticeRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <PracticePage showCreateProblem={can(user.role).canCreateProblem} />;
}
