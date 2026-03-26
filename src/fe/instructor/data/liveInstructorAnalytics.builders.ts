import { BASE_INSTRUCTOR_ANALYTICS } from "@/fe/instructor/data/liveInstructorAnalytics.base";
import {
  EXTRA_CONTESTS,
  EXTRA_SEGMENTED_METRICS,
  EXTRA_STUDENTS,
  EXTRA_STUDENT_VIEWS,
} from "@/fe/instructor/data/liveInstructorAnalytics.extras";
import type {
  InstructorAnalyticsUiPayload,
  MetricBundle,
  SegmentKey,
  StudentCatalogRow,
} from "@/fe/instructor/data/liveInstructorAnalytics.types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildStudentMetricBundle(
  studentIndex: number,
  segmentBundle: MetricBundle,
): MetricBundle {
  const contestOffset = (studentIndex % 3) - 1;
  const problemOffset = (studentIndex % 4) - 1.5;

  return {
    contest_metrics: segmentBundle.contest_metrics.map((row, contestIndex) => ({
      ...row,
      solve_rate: clamp(row.solve_rate + contestOffset * 3 + (contestIndex % 2), 18, 100),
      mean_solve_time_minutes:
        row.mean_solve_time_minutes == null
          ? null
          : clamp(row.mean_solve_time_minutes + contestOffset * 2 + (contestIndex % 3), 8, 120),
      median_solve_time_minutes:
        row.median_solve_time_minutes == null
          ? null
          : clamp(row.median_solve_time_minutes + contestOffset * 2 + (contestIndex % 2), 6, 110),
      attempts_to_solve:
        row.attempts_to_solve == null
          ? null
          : Number(
              clamp(
                row.attempts_to_solve + contestOffset * 0.2 + (contestIndex % 2) * 0.1,
                1,
                8,
              ).toFixed(1),
            ),
    })),
    problem_metrics: segmentBundle.problem_metrics.map((row, problemIndex) => ({
      ...row,
      time_to_first_submission_minutes:
        row.time_to_first_submission_minutes == null
          ? null
          : clamp(row.time_to_first_submission_minutes + problemOffset * 2 + (problemIndex % 2), 2, 90),
      time_to_first_correct_submission_minutes:
        row.time_to_first_correct_submission_minutes == null
          ? null
          : clamp(
              row.time_to_first_correct_submission_minutes + problemOffset * 2 + (problemIndex % 3),
              4,
              120,
            ),
      post_hint_solve_probability:
        row.post_hint_solve_probability == null
          ? null
          : clamp(row.post_hint_solve_probability + contestOffset * 4 + (problemIndex % 2), 12, 100),
      attempts_before_hint:
        row.attempts_before_hint == null
          ? null
          : Number(
              clamp(row.attempts_before_hint + problemOffset * 0.2 + (problemIndex % 2) * 0.1, 0.5, 8).toFixed(1),
            ),
      attempts_after_hint:
        row.attempts_after_hint == null
          ? null
          : Number(
              clamp(row.attempts_after_hint + problemOffset * 0.15 + (problemIndex % 2) * 0.1, 0, 6).toFixed(1),
            ),
      time_to_solve_after_hint_minutes:
        row.time_to_solve_after_hint_minutes == null
          ? null
          : clamp(row.time_to_solve_after_hint_minutes + problemOffset * 2 + (problemIndex % 2), 4, 90),
    })),
  };
}

function buildMergedSegmentedMetrics(
  base: InstructorAnalyticsUiPayload["segmented_metrics"],
): InstructorAnalyticsUiPayload["segmented_metrics"] {
  return (Object.keys(base) as SegmentKey[]).reduce<InstructorAnalyticsUiPayload["segmented_metrics"]>(
    (acc, segment) => {
      acc[segment] = {
        contest_metrics: [...base[segment].contest_metrics, ...EXTRA_SEGMENTED_METRICS[segment].contest_metrics],
        problem_metrics: [...base[segment].problem_metrics, ...EXTRA_SEGMENTED_METRICS[segment].problem_metrics],
      };
      return acc;
    },
    {} as InstructorAnalyticsUiPayload["segmented_metrics"],
  );
}

function buildStudentViews(
  studentsCatalog: StudentCatalogRow[],
  segmentedMetrics: InstructorAnalyticsUiPayload["segmented_metrics"],
): InstructorAnalyticsUiPayload["student_views"] {
  const seededStudentViews = {
    ...BASE_INSTRUCTOR_ANALYTICS.student_views,
    ...EXTRA_STUDENT_VIEWS,
  };

  return studentsCatalog.reduce<InstructorAnalyticsUiPayload["student_views"]>((acc, student, index) => {
    acc[student.computingId] = buildStudentMetricBundle(index, segmentedMetrics[student.segment]);
    return acc;
  }, seededStudentViews);
}

export function buildInstructorAnalytics(): InstructorAnalyticsUiPayload {
  const contestsCatalog = [...BASE_INSTRUCTOR_ANALYTICS.contests_catalog, ...EXTRA_CONTESTS];
  const studentsCatalog = [...BASE_INSTRUCTOR_ANALYTICS.students_catalog, ...EXTRA_STUDENTS];
  const segmentedMetrics = buildMergedSegmentedMetrics(BASE_INSTRUCTOR_ANALYTICS.segmented_metrics);

  return {
    ...BASE_INSTRUCTOR_ANALYTICS,
    contests_catalog: contestsCatalog,
    students_catalog: studentsCatalog,
    segmented_metrics: segmentedMetrics,
    student_views: buildStudentViews(studentsCatalog, segmentedMetrics),
  };
}
