import type { InstructorDashboardData } from "@/lib/types/instructorDashboard";
import { trpc } from "@/lib/trpc/client";
import { EMPTY_INSTRUCTOR_DASHBOARD_DATA } from "./instructorDashboard.constants";
import { mapInstructorDashboardResponse } from "./instructorDashboard.mapper";

export { EMPTY_INSTRUCTOR_DASHBOARD_DATA };

export function useInstructorDashboard(): {
  data: InstructorDashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = trpc.instructorDashboard.get.useQuery(undefined, {
    staleTime: 30000,
  });

  return {
    data: data ? mapInstructorDashboardResponse(data) : undefined,
    isLoading,
    isError,
  };
}
