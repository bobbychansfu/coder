// "Problem score" contest standings: rank by summed problem points.
//
// - an entry solves a problem when any member's status is correct or scores points
// - an entry earns its best member's points on each problem, so two teammates solving
//   the same problem count once; the entry's score is the sum of those
// - rank by score, then problems solved, then name

export interface PointsStatus {
  problemId: string;
  status: string;
  score: number;
}

export interface PointsEntry {
  // A team's name, or the student's own name when they compete alone.
  name: string;
  members?: string[];
  isCurrentUser: boolean;
  // Every stored problem status of the entry's members.
  statuses: PointsStatus[];
}

export interface PointsStandingsRow {
  scoringRule: "POINTS";
  rank: number;
  name: string;
  members?: string[];
  solved: number;
  score: number;
  problems: Record<string, { points: number }>;
  isCurrentUser: boolean;
}

export function buildPointsStandings(input: {
  problems: { problemId: string; code: string }[];
  entries: PointsEntry[];
}): PointsStandingsRow[] {
  const codeByProblemId = new Map(input.problems.map((problem) => [problem.problemId, problem.code]));

  const rows = input.entries.map((entry) => {
    const bestByProblemId = new Map<string, { points: number; solved: boolean }>();
    for (const status of entry.statuses) {
      const best = bestByProblemId.get(status.problemId);
      const solved = status.status.trim().toLowerCase() === "correct" || status.score > 0;
      bestByProblemId.set(status.problemId, {
        points: best ? Math.max(best.points, status.score) : status.score,
        solved: (best?.solved ?? false) || solved,
      });
    }

    const results = [...bestByProblemId.entries()];
    return {
      entry,
      solved: results.filter(([, result]) => result.solved).length,
      score: results.reduce((sum, [, result]) => sum + Math.max(0, result.points), 0),
      problems: Object.fromEntries(
        results.flatMap(([problemId, result]) => {
          const code = codeByProblemId.get(problemId);
          return code ? [[code, { points: result.points }] as const] : [];
        }),
      ),
    };
  });

  rows.sort(
    (left, right) =>
      right.score - left.score ||
      right.solved - left.solved ||
      left.entry.name.localeCompare(right.entry.name),
  );

  return rows.map(({ entry, solved, score, problems }, index) => ({
    scoringRule: "POINTS" as const,
    rank: index + 1,
    name: entry.name,
    members: entry.members,
    solved,
    score,
    problems,
    isCurrentUser: entry.isCurrentUser,
  }));
}
