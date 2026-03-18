const MINIMUM_SESSION_MINUTES = 15;
const MAXIMUM_GAP_MINUTES = 45;
const SOLVED_WEIGHT = 10;
const CONTEST_WEIGHT = 20;
const SUBMISSION_WEIGHT = 8;

export function denseRank(values: number[], target: number): number | null {
  let rank = 0;
  let previous: number | null = null;

  for (const value of values) {
    if (previous === null || previous !== value) {
      rank += 1;
      previous = value;
    }

    if (value === target) {
      return rank;
    }
  }

  return null;
}

export function estimateStudyMinutes(activityDates: Date[]): number {
  if (activityDates.length === 0) {
    return 0;
  }

  const byDay = new Map<string, number[]>();
  for (const date of activityDates) {
    const key = date.toISOString().slice(0, 10);
    const entries = byDay.get(key) ?? [];
    entries.push(date.getTime());
    byDay.set(key, entries);
  }

  let totalMinutes = 0;
  for (const timestamps of byDay.values()) {
    const sorted = [...timestamps].sort((left, right) => left - right);
    totalMinutes += MINIMUM_SESSION_MINUTES;

    for (let index = 1; index < sorted.length; index += 1) {
      const gapMinutes = (sorted[index] - sorted[index - 1]) / 60000;
      totalMinutes += Math.max(0, Math.min(gapMinutes, MAXIMUM_GAP_MINUTES));
    }
  }

  return Math.round(totalMinutes);
}

export function participationScore(student: {
  problemsSolved: number;
  contestsParticipated: number;
  pointsAcquired: number;
  logins7d: number;
  submissions7d: number;
}): number {
  return (
    student.problemsSolved * SOLVED_WEIGHT +
    student.contestsParticipated * CONTEST_WEIGHT +
    student.pointsAcquired +
    student.logins7d +
    student.submissions7d * SUBMISSION_WEIGHT
  );
}
