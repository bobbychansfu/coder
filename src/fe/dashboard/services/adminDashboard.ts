import type { AdminDashboardData } from "@/lib/types/adminDashboard";
import { trpc } from "@/lib/trpc/client";
import {
  ADMIN_DASHBOARD_STALE_TIME_MS,
  EMPTY_ADMIN_DASHBOARD_DATA,
} from "./adminDashboard.constants";
import { mapAdminDashboardResponse } from "./adminDashboard.mapper";

export { EMPTY_ADMIN_DASHBOARD_DATA };

export function useAdminDashboard(): {
  data: AdminDashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = trpc.adminDashboard.get.useQuery(undefined, {
    staleTime: ADMIN_DASHBOARD_STALE_TIME_MS,
  });

  return {
    data: data ? mapAdminDashboardResponse(data) : undefined,
    isLoading,
    isError,
  };
}
