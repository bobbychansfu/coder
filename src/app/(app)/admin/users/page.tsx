import AdminUserManagementPage from "@/fe/admin/page/AdminUserManagementPage";
import { requireRole } from "@/lib/requireRole";

export default async function AdminUsersRoute() {
  await requireRole(["admin"]);

  return <AdminUserManagementPage />;
}
