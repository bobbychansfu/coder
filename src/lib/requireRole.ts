import { redirect } from "next/navigation";
import type { Role } from "@/lib/authz";
import { getCurrentUser, type CurrentUser } from "@/lib/session";

export async function requireRole(allowedRoles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/403");
  }

  return user;
}
