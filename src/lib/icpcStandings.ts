// ICPC contest standings, computed from contest submissions.
//
// Rules (as on Kattis and at ICPC regionals):
// - rank by problems solved, then by total penalty time, then by who reached their
//   last accepted solution earliest
// - a solved problem costs the minutes from contest start to its first accepted
//   submission, plus 20 minutes for every rejected submission before it
// - unsolved problems cost nothing; submissions after the first accepted one are ignored
// - compile errors and judge-side failures are not rejections; pending submissions
//   have no verdict yet
// - only submissions made while the contest is running count, so practising after the
//   contest ends never changes the standings

export const ICPC_PENALTY_MINUTES = 20;

const REJECTED_VERDICTS = new Set(["WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR"]);

export interface IcpcSubmission {
  problemId: string;
  status: string;
  createdAt: Date;
}

export interface IcpcEntry {
  // A team's name, or the student's own name when they compete alone.
  name: string;
  members?: string[];
  isCurrentUser: boolean;
  // Every submission by the entry's members, in any order.
  submissions: IcpcSubmission[];
}

export interface IcpcProblemCell {
  solved: boolean;
  // Counted submissions: rejections, plus the accepted one when solved.
  attempts: number;
  // Minutes from contest start to the first accepted submission.
  minutes?: number;
  // This entry was the first to solve the problem.
  firstSolve?: boolean;
}

export interface IcpcStandingsRow {
  scoringRule: "ICPC";
  rank: number;
  name: string;
  members?: string[];
  solved: number;
  penalty: number;
  problems: Record<string, IcpcProblemCell>;
  isCurrentUser: boolean;
}

export function buildIcpcStandings(input: {
  problems: { problemId: string; code: string }[];
  entries: IcpcEntry[];
  startsAt: Date;
  // Contest end as a timestamp; NaN when the contest has no end.
  endsAt: number;
}): IcpcStandingsRow[] {
  const start = input.startsAt.getTime();
  const codeByProblemId = new Map(input.problems.map((problem) => [problem.problemId, problem.code]));

  const scored = input.entries.map((entry) => {
    const submissionsByCode = new Map<string, IcpcSubmission[]>();
    for (const submission of entry.submissions) {
      const code = codeByProblemId.get(submission.problemId);
      const at = submission.createdAt.getTime();
      if (!code || at < start || (Number.isFinite(input.endsAt) && at > input.endsAt)) continue;
      const list = submissionsByCode.get(code) ?? [];
      list.push(submission);
      submissionsByCode.set(code, list);
    }

    const problems: Record<string, IcpcProblemCell> = {};
    const acceptedAtByCode = new Map<string, number>();
    let solved = 0;
    let penalty = 0;
    let lastAcceptedAt = Number.NEGATIVE_INFINITY;

    for (const [code, submissions] of submissionsByCode) {
      submissions.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
      let rejected = 0;
      let acceptedAt: number | null = null;
      for (const submission of submissions) {
        if (submission.status === "ACCEPTED") {
          acceptedAt = submission.createdAt.getTime();
          break;
        }
        if (REJECTED_VERDICTS.has(submission.status)) rejected += 1;
      }

      if (acceptedAt !== null) {
        const minutes = Math.floor((acceptedAt - start) / 60_000);
        solved += 1;
        penalty += minutes + ICPC_PENALTY_MINUTES * rejected;
        lastAcceptedAt = Math.max(lastAcceptedAt, acceptedAt);
        acceptedAtByCode.set(code, acceptedAt);
        problems[code] = { solved: true, attempts: rejected + 1, minutes };
      } else if (rejected > 0) {
        problems[code] = { solved: false, attempts: rejected };
      }
    }

    return { entry, problems, solved, penalty, lastAcceptedAt, acceptedAtByCode };
  });

  // First to solve: the earliest accepted submission on each problem (ties share it).
  const firstAcceptedAt = new Map<string, number>();
  for (const { acceptedAtByCode } of scored) {
    for (const [code, at] of acceptedAtByCode) {
      const first = firstAcceptedAt.get(code);
      if (first === undefined || at < first) firstAcceptedAt.set(code, at);
    }
  }
  for (const { problems, acceptedAtByCode } of scored) {
    for (const [code, at] of acceptedAtByCode) {
      if (at === firstAcceptedAt.get(code)) problems[code].firstSolve = true;
    }
  }

  scored.sort(
    (left, right) =>
      right.solved - left.solved ||
      left.penalty - right.penalty ||
      left.lastAcceptedAt - right.lastAcceptedAt ||
      left.entry.name.localeCompare(right.entry.name),
  );

  return scored.map(({ entry, problems, solved, penalty }, index) => ({
    scoringRule: "ICPC" as const,
    rank: index + 1,
    name: entry.name,
    members: entry.members,
    solved,
    penalty,
    problems,
    isCurrentUser: entry.isCurrentUser,
  }));
}
