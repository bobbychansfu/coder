import type { InstructorAnalysisData } from "@/lib/types/instructorAnalysis";
import type { SnapshotPreference } from "@/lib/trpc/types/instructorAnalysis";
import { trpc } from "@/lib/trpc/client";
import {
  EMPTY_INSTRUCTOR_ANALYSIS_DATA,
  INSTRUCTOR_ANALYSIS_STALE_TIME_MS,
} from "./instructorAnalysis.constants";
import { mapInstructorAnalysisResponse } from "./instructorAnalysis.mapper";

export { EMPTY_INSTRUCTOR_ANALYSIS_DATA };

interface UseInstructorAnalysisInput {
  contestId?: string;
  problemId?: string;
  snapshotPreference: SnapshotPreference;
}

export function useInstructorAnalysis(
  input: UseInstructorAnalysisInput,
): {
  data: InstructorAnalysisData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
} {
  const query = trpc.instructorAnalysis.get.useQuery(input, {
    staleTime: INSTRUCTOR_ANALYSIS_STALE_TIME_MS,
  });

  return {
    data: query.data ? mapInstructorAnalysisResponse(query.data) : undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
