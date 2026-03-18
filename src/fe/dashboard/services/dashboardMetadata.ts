import type { StudentDashboardMetadata } from "@/lib/types/dashboardMetadata";
import { trpc } from "@/lib/trpc/client";
import { mapStudentDashboardMetadata } from "./dashboardMetadata.mapper";

export { EMPTY_STUDENT_DASHBOARD_METADATA } from "./dashboardMetadata.constants";

export function useStudentDashboardMetadata(): {
  metadata: StudentDashboardMetadata | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = trpc.dashboardMetadata.getStudent.useQuery(undefined, {
    staleTime: 30000,
  });

  return {
    metadata: data ? mapStudentDashboardMetadata(data) : undefined,
    isLoading,
    isError,
  };
}
