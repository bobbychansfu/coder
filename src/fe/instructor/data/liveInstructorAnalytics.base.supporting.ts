import {
  DEFAULT_AI_HINT_NOTE,
  DEFAULT_GAMIFICATION_NOTE,
} from "@/fe/instructor/data/analysisConstants";
import type {
  ContestCatalogRow,
  InstructorAnalyticsUiPayload,
  StudentCatalogRow,
} from "@/fe/instructor/data/liveInstructorAnalytics.types";

export const BASE_STUDENT_VIEWS: InstructorAnalyticsUiPayload["student_views"] = {
  student01: {
    contest_metrics: [
      {
        contest_id: "contest-1",
        contest_name: "Week 3 Lab Contest",
        solve_rate: 100,
        mean_solve_time_minutes: 28,
        median_solve_time_minutes: 28,
        attempts_to_solve: 1.8,
      },
    ],
    problem_metrics: [
      {
        contest_id: "contest-1",
        contest_name: "Week 3 Lab Contest",
        problem_id: "p1",
        problem_code: "A",
        problem_title: "Warmup Arrays",
        time_to_first_submission_minutes: 5,
        time_to_first_correct_submission_minutes: 11,
        post_hint_solve_probability: 100,
        attempts_before_hint: 1,
        attempts_after_hint: 0,
        time_to_solve_after_hint_minutes: null,
      },
    ],
  },
  student02: {
    contest_metrics: [
      {
        contest_id: "contest-2",
        contest_name: "Trees & Graphs Challenge",
        solve_rate: 50,
        mean_solve_time_minutes: 47,
        median_solve_time_minutes: 47,
        attempts_to_solve: 3,
      },
    ],
    problem_metrics: [
      {
        contest_id: "contest-2",
        contest_name: "Trees & Graphs Challenge",
        problem_id: "p3",
        problem_code: "C",
        problem_title: "Binary Tree Paths",
        time_to_first_submission_minutes: 14,
        time_to_first_correct_submission_minutes: 29,
        post_hint_solve_probability: 60,
        attempts_before_hint: 2,
        attempts_after_hint: 1,
        time_to_solve_after_hint_minutes: 17,
      },
    ],
  },
};

export const BASE_STUDENTS_CATALOG: StudentCatalogRow[] = [
  { computingId: "student01", name: "Amy Yu", segment: "groupA" },
  { computingId: "student02", name: "Leo Chen", segment: "groupB" },
  { computingId: "student03", name: "Mia Patel", segment: "groupC" },
];

export const BASE_CONTESTS_CATALOG: ContestCatalogRow[] = [
  {
    id: "contest-1",
    name: "Week 3 Lab Contest",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare aggressive hint timing against short-form beginner contests.",
  },
  {
    id: "contest-2",
    name: "Trees & Graphs Challenge",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare delayed hint timing for stronger students or harder content.",
  },
  {
    id: "contest-3",
    name: "Arrays & Strings Basics",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare faster onboarding and participation in shorter practice-heavy contests.",
  },
  {
    id: "contest-4",
    name: "Dynamic Programming Sprint",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare long-form problem solving where hint timing affects persistence more strongly.",
  },
  {
    id: "contest-5",
    name: "Greedy Open",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare medium-length contests where pacing and collaboration structure both affect completion.",
  },
  {
    id: "contest-6",
    name: "Graph Theory Marathon",
    hintNote: DEFAULT_AI_HINT_NOTE,
    gamificationNote: DEFAULT_GAMIFICATION_NOTE,
    comparisonNote: "Best used to compare harder graph-heavy contests where hint timing shifts time-to-first-correct more strongly.",
  },
];

export const BASE_ANALYTICS_NOTES: string[] = [];
