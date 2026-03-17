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

export interface StudentProgressStats {
  userId: string;
  computingId: string;
  pointsAcquired: number;
  problemsSolved: number;
  contestsParticipated: number;
  totalSubmissions: number;
  submissions7d: number;
  logins7d: number;
  activeDays7d: number;
  loginStreakDays: number;
  rankLabel: string;
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
    } else {
      current = 1;
    }
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

export function eligibleBadgeCodes(stats: StudentProgressStats): string[] {
  return [
    stats.totalSubmissions >= 1 ? "first-submission" : null,
    stats.problemsSolved >= 1 ? "first-accepted" : null,
    stats.logins7d >= 5 ? "active-learner" : null,
    stats.activeDays7d >= 7 ? "consistent-week" : null,
    stats.loginStreakDays >= 3 ? "login-streak-3" : null,
    stats.loginStreakDays >= 7 ? "login-streak-7" : null,
    stats.submissions7d >= 5 ? "submission-sprinter" : null,
    stats.submissions7d >= 20 ? "submission-marathon" : null,
    stats.problemsSolved >= 10 ? "problem-solver-10" : null,
    stats.problemsSolved >= 25 ? "problem-solver-25" : null,
    stats.problemsSolved >= 50 ? "problem-solver-50" : null,
    stats.contestsParticipated >= 5 ? "contest-regular" : null,
    stats.contestsParticipated >= 10 ? "contest-veteran" : null,
    stats.pointsAcquired >= 1000 ? "point-collector" : null,
    stats.pointsAcquired >= 2500 ? "elite-scorer" : null,
  ].filter((code): code is string => Boolean(code));
}
