export type {
  ContestCatalogRow,
  ContestMetricRow,
  InstructorAnalyticsUiPayload,
  MetricBundle,
  ProblemMetricRow,
  SegmentKey,
  StudentCatalogRow,
  ViewMode,
} from "@/fe/instructor/data/liveInstructorAnalytics.types";
export { BASE_INSTRUCTOR_ANALYTICS } from "@/fe/instructor/data/liveInstructorAnalytics.base";
export {
  EXTRA_CONTESTS,
  EXTRA_SEGMENTED_METRICS,
  EXTRA_STUDENTS,
  EXTRA_STUDENT_VIEWS,
} from "@/fe/instructor/data/liveInstructorAnalytics.extras";
export { buildInstructorAnalytics } from "@/fe/instructor/data/liveInstructorAnalytics.builders";

import { buildInstructorAnalytics } from "@/fe/instructor/data/liveInstructorAnalytics.builders";
import type { InstructorAnalyticsUiPayload } from "@/fe/instructor/data/liveInstructorAnalytics.types";

export const MOCK_INSTRUCTOR_ANALYTICS: InstructorAnalyticsUiPayload = buildInstructorAnalytics();
