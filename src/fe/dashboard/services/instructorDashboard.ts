import type { InstructorDashboardData } from "@/lib/types/instructorDashboard";
import { trpc } from "@/lib/trpc/client";
import {
  EMPTY_INSTRUCTOR_DASHBOARD_DATA,
  INSTRUCTOR_DASHBOARD_STALE_TIME_MS,
} from "./instructorDashboard.constants";
import { mapInstructorDashboardResponse } from "./instructorDashboard.mapper";

export { EMPTY_INSTRUCTOR_DASHBOARD_DATA };

export function useInstructorDashboard(): {
  data: InstructorDashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = trpc.instructorDashboard.get.useQuery(undefined, {
    staleTime: INSTRUCTOR_DASHBOARD_STALE_TIME_MS,
  });

  return {
    data: data ? mapInstructorDashboardResponse(data) : undefined,
    isLoading,
    isError,
  };
}
