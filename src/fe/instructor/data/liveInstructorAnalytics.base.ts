import { BASE_SEGMENTED_METRICS_ALL } from "@/fe/instructor/data/liveInstructorAnalytics.base.all";
import { BASE_SEGMENTED_METRICS_GROUP_A } from "@/fe/instructor/data/liveInstructorAnalytics.base.groupA";
import { BASE_SEGMENTED_METRICS_GROUP_B } from "@/fe/instructor/data/liveInstructorAnalytics.base.groupB";
import { BASE_SEGMENTED_METRICS_GROUP_C } from "@/fe/instructor/data/liveInstructorAnalytics.base.groupC";
import {
  BASE_ANALYTICS_NOTES,
  BASE_CONTESTS_CATALOG,
  BASE_STUDENTS_CATALOG,
  BASE_STUDENT_VIEWS,
} from "@/fe/instructor/data/liveInstructorAnalytics.base.supporting";
import type { InstructorAnalyticsUiPayload } from "@/fe/instructor/data/liveInstructorAnalytics.types";

export const BASE_INSTRUCTOR_ANALYTICS: InstructorAnalyticsUiPayload = {
  segmented_metrics: {
    all: BASE_SEGMENTED_METRICS_ALL,
    groupA: BASE_SEGMENTED_METRICS_GROUP_A,
    groupB: BASE_SEGMENTED_METRICS_GROUP_B,
    groupC: BASE_SEGMENTED_METRICS_GROUP_C,
  },
  student_views: BASE_STUDENT_VIEWS,
  students_catalog: BASE_STUDENTS_CATALOG,
  contests_catalog: BASE_CONTESTS_CATALOG,
  analytics_notes: BASE_ANALYTICS_NOTES,
};
