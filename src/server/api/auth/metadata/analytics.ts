import {
  type ContestMetricRow,
  type ProblemMetricRow,
  type SegmentedMetricBundle,
  average,
  median,
  round2,
} from "./shared";

interface AnalyticsContest {
  id: string;
  name: string;
  startsAt: Date;
  contestProblems: Array<{
    problem: { id: string; code: string; title: string };
  }>;
  submissions: Array<{
    problemId: string;
    status: string;
    createdAt: Date;
    user: { role: string; computingId: string };
  }>;
}

export function computeContestAndProblemMetrics(args: {
  contests: AnalyticsContest[];
  includeComputingId: (computingId: string) => boolean;
}): SegmentedMetricBundle {
  const contestMetrics: ContestMetricRow[] = [];
  const problemMetrics: ProblemMetricRow[] = [];

  for (const contest of args.contests) {
    const studentSubs = contest.submissions.filter(
      (submission) =>
        submission.user.role === "STUDENT" && args.includeComputingId(submission.user.computingId),
    );
    const participants = new Set(studentSubs.map((submission) => submission.user.computingId));
    const solvedUsers = new Set(
      studentSubs
        .filter((submission) => submission.status === "ACCEPTED")
        .map((submission) => submission.user.computingId),
    );

    const attemptsUntilSolve: number[] = [];
    const solveTimesMinutes: number[] = [];
    const byUserProblem = new Map<string, typeof studentSubs>();

    for (const submission of studentSubs) {
      const key = `${submission.user.computingId}:${submission.problemId}`;
      const entries = byUserProblem.get(key) ?? [];
      entries.push(submission);
      byUserProblem.set(key, entries);
    }

    for (const submissions of byUserProblem.values()) {
      submissions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const firstAcceptedIndex = submissions.findIndex((submission) => submission.status === "ACCEPTED");
      if (firstAcceptedIndex < 0) {
        continue;
      }

      attemptsUntilSolve.push(firstAcceptedIndex + 1);
      const acceptedAt = submissions[firstAcceptedIndex].createdAt.getTime();
      solveTimesMinutes.push(Math.max(0, (acceptedAt - contest.startsAt.getTime()) / 60000));
    }

    contestMetrics.push({
      contest_id: contest.id,
      contest_name: contest.name,
      solve_rate: round2(participants.size === 0 ? 0 : (solvedUsers.size / participants.size) * 100) ?? 0,
      mean_solve_time_minutes: round2(average(solveTimesMinutes)),
      median_solve_time_minutes: round2(median(solveTimesMinutes)),
      attempts_to_solve: round2(average(attemptsUntilSolve)),
    });

    for (const link of contest.contestProblems) {
      const problemSubs = studentSubs
        .filter((submission) => submission.problemId === link.problem.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const byUserSubs = new Map<string, typeof problemSubs>();
      for (const submission of problemSubs) {
        const entries = byUserSubs.get(submission.user.computingId) ?? [];
        entries.push(submission);
        byUserSubs.set(submission.user.computingId, entries);
      }

      const attemptsBeforeHint: number[] = [];
      const attemptsAfterHint: number[] = [];
      const solveAfterHintMinutes: number[] = [];
      let postHintCandidates = 0;
      let postHintSolved = 0;

      for (const submissions of byUserSubs.values()) {
        submissions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const attempts = submissions.length;
        const firstAcceptedIndex = submissions.findIndex((submission) => submission.status === "ACCEPTED");

        attemptsBeforeHint.push(Math.min(attempts, 2));
        attemptsAfterHint.push(Math.max(attempts - 2, 0));

        if (attempts <= 2) {
          continue;
        }

        postHintCandidates += 1;
        if (firstAcceptedIndex >= 2) {
          postHintSolved += 1;
          const hintAt = submissions[1]?.createdAt.getTime();
          const solvedAt = submissions[firstAcceptedIndex]?.createdAt.getTime();
          if (hintAt && solvedAt && solvedAt >= hintAt) {
            solveAfterHintMinutes.push((solvedAt - hintAt) / 60000);
          }
        }
      }

      const firstSubmission = problemSubs[0];
      const firstCorrect = problemSubs.find((submission) => submission.status === "ACCEPTED");

      problemMetrics.push({
        contest_id: contest.id,
        contest_name: contest.name,
        problem_id: link.problem.id,
        problem_code: link.problem.code,
        problem_title: link.problem.title,
        time_to_first_submission_minutes: round2(
          firstSubmission ? (firstSubmission.createdAt.getTime() - contest.startsAt.getTime()) / 60000 : null,
        ),
        time_to_first_correct_submission_minutes: round2(
          firstCorrect ? (firstCorrect.createdAt.getTime() - contest.startsAt.getTime()) / 60000 : null,
        ),
        post_hint_solve_probability:
          postHintCandidates === 0 ? null : round2((postHintSolved / postHintCandidates) * 100),
        attempts_before_hint: round2(average(attemptsBeforeHint)),
        attempts_after_hint: round2(average(attemptsAfterHint)),
        time_to_solve_after_hint_minutes: round2(average(solveAfterHintMinutes)),
      });
    }
  }

  return {
    contest_metrics: contestMetrics,
    problem_metrics: problemMetrics,
  };
}
