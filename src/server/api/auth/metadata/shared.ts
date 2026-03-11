export const WEIGHTS = {
  solved: 10,
  contests: 20,
  points: 1,
  login7d: 1,
  submission7d: 8,
} as const;

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const BADGE_DEFINITIONS = [
  { code: "first-submission", name: "First Submission", description: "Submit at least one solution." },
  { code: "first-accepted", name: "First Accepted", description: "Solve your first problem." },
  { code: "active-learner", name: "Active Learner", description: "Log in at least 5 times in the last 7 days." },
  { code: "consistent-week", name: "Consistent Week", description: "Be active on 7 distinct days in the last 7 days." },
  { code: "login-streak-3", name: "3-Day Login Streak", description: "Log in on 3 consecutive days." },
  { code: "login-streak-7", name: "7-Day Login Streak", description: "Log in on 7 consecutive days." },
  { code: "submission-sprinter", name: "Submission Sprinter", description: "Submit 5 times in the last 7 days." },
  { code: "submission-marathon", name: "Submission Marathon", description: "Submit 20 times in the last 7 days." },
  { code: "problem-solver-10", name: "Problem Solver I", description: "Solve at least 10 problems." },
  { code: "problem-solver-25", name: "Problem Solver II", description: "Solve at least 25 problems." },
  { code: "problem-solver-50", name: "Problem Solver III", description: "Solve at least 50 problems." },
  { code: "contest-regular", name: "Contest Regular", description: "Participate in at least 5 contests." },
  { code: "contest-veteran", name: "Contest Veteran", description: "Participate in at least 10 contests." },
  { code: "point-collector", name: "Point Collector", description: "Reach at least 1000 total points." },
  { code: "elite-scorer", name: "Elite Scorer", description: "Reach at least 2500 total points." },
] as const;

export interface StudentStats {
  userId: string;
  computingId: string;
  firstName: string;
  lastName: string;
  pointsAcquired: number;
  problemsSolved: number;
  contestsParticipated: number;
  totalSubmissions: number;
  problemsSolved7d: number;
  contestsParticipated7d: number;
  points7d: number;
  submissions7d: number;
  activeDays7d: number;
  logins7d: number;
  loginStreakDays: number;
  timeSpentMinutes7d: number;
  rankLabel: string;
}

export interface PersistedBadge {
  code: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: Date | null;
}

export interface ContestMetricRow {
  contest_id: string;
  contest_name: string;
  solve_rate: number;
  mean_solve_time_minutes: number | null;
  median_solve_time_minutes: number | null;
  attempts_to_solve: number | null;
}

export interface ProblemMetricRow {
  contest_id: string;
  contest_name: string;
  problem_id: string;
  problem_code: string;
  problem_title: string;
  time_to_first_submission_minutes: number | null;
  time_to_first_correct_submission_minutes: number | null;
  post_hint_solve_probability: number | null;
  attempts_before_hint: number | null;
  attempts_after_hint: number | null;
  time_to_solve_after_hint_minutes: number | null;
}

export type SegmentKey = "all" | "groupA" | "groupB";

export interface SegmentedMetricBundle {
  contest_metrics: ContestMetricRow[];
  problem_metrics: ProblemMetricRow[];
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function consecutiveDayStreak(dayKeys: string[]): number {
  if (dayKeys.length === 0) {
    return 0;
  }

  const uniqueDays = [...new Set(dayKeys)].sort();
  let best = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const prev = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);
    const next = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
    const diffDays = Math.round((next.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
      continue;
    }

    current = 1;
  }

  return best;
}

export function buildRankLabel(points: number): string {
  if (points > 1000) return "Expert";
  if (points > 500) return "Advanced";
  if (points > 200) return "Intermediate";
  if (points > 100) return "Beginner";
  return "Novice";
}

export function participationBase(stats: StudentStats): number {
  return (
    stats.problemsSolved * WEIGHTS.solved +
    stats.contestsParticipated * WEIGHTS.contests +
    stats.pointsAcquired * WEIGHTS.points
  );
}

export function participationBonus(stats: StudentStats): number {
  return stats.logins7d * WEIGHTS.login7d + stats.submissions7d * WEIGHTS.submission7d;
}

export function denseRank(values: number[], target: number): number | null {
  if (values.length === 0) {
    return null;
  }

  let rank = 0;
  let last: number | null = null;

  for (const score of values) {
    if (last === null || last !== score) {
      rank += 1;
      last = score;
    }
    if (score === target) {
      return rank;
    }
  }

  return null;
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function round2(value: number | null): number | null {
  if (value === null) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

export function inferSegment(computingId: string): "groupA" | "groupB" {
  const seed = [...computingId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return seed % 2 === 0 ? "groupA" : "groupB";
}

export function estimateStudyMinutes(activityDates: Date[]): number {
  if (activityDates.length === 0) {
    return 0;
  }

  const byDay = new Map<string, number[]>();
  for (const date of activityDates) {
    const key = dayKey(date);
    const entries = byDay.get(key) ?? [];
    entries.push(date.getTime());
    byDay.set(key, entries);
  }

  let totalMinutes = 0;
  for (const timestamps of byDay.values()) {
    const sorted = [...timestamps].sort((a, b) => a - b);
    totalMinutes += 15;

    for (let index = 1; index < sorted.length; index += 1) {
      const gapMinutes = (sorted[index] - sorted[index - 1]) / 60000;
      totalMinutes += Math.max(0, Math.min(gapMinutes, 45));
    }
  }

  return Math.round(totalMinutes);
}
