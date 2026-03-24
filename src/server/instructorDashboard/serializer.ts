import type { InstructorDashboardResponse } from "@/lib/trpc/types/instructorDashboard";
import type { InstructorDashboardSnapshot } from "./repository";

function titleCaseContestStatus(
  status: "DRAFT" | "UPCOMING" | "ACTIVE",
): "Draft" | "Upcoming" | "Active" {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UPCOMING":
      return "Upcoming";
    case "ACTIVE":
      return "Active";
  }
}

function buildReadinessItems(
  contest: InstructorDashboardSnapshot["contests"][number],
): Array<{ label: string; done: boolean }> {
  const contestantParticipations = contest.participations.filter(
    (participation) => participation.role === "contestant",
  );
  const assignedContestants = contestantParticipations.filter(
    (participation) => participation.experimentGroup !== null,
  );
  const allProblemsHaveStarterCode =
    contest.contestProblems.length > 0 &&
    contest.contestProblems.every((problem) => problem.problem.starterCodes.length > 0);

  return [
    { label: "Contest published", done: contest.published },
    { label: "Problem set ready", done: contest.contestProblems.length > 0 },
    { label: "Starter code ready", done: allProblemsHaveStarterCode },
    {
      label: "Participant groups assigned",
      done:
        contestantParticipations.length > 0 &&
        assignedContestants.length === contestantParticipations.length,
    },
    {
      label: "AI hint policy configured",
      done: !contest.aiHintEnabled || contest.experimentGroups.length > 0,
    },
    { label: "Announcement posted", done: contest.announcements.length > 0 },
  ];
}

function buildReadinessState(
  items: Array<{ label: string; done: boolean }>,
): "Ready" | "Needs Attention" | "Blocked" {
  const incomplete = items.filter((item) => !item.done).length;

  if (incomplete === 0) {
    return "Ready";
  }

  if (incomplete >= 3) {
    return "Blocked";
  }

  return "Needs Attention";
}

function formatDeltaLabel(current: number, previous: number, suffix = "pts"): string {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return "No earlier baseline";
  }

  const delta = Math.round((current - previous) * 10) / 10;
  if (Math.abs(delta) < 0.1) {
    return `Stable vs earlier ${suffix === "pts" ? "baseline" : "period"}`;
  }

  const direction = delta > 0 ? "+" : "";
  return `${direction}${delta}${suffix ? ` ${suffix}` : ""} vs earlier period`;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildInstructorDashboardResponse(
  snapshot: InstructorDashboardSnapshot,
): InstructorDashboardResponse {
  const contests = [...snapshot.contests].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );
  const metricsUpdatedAt =
    contests.length > 0
      ? new Date(
          Math.max(
            ...contests.map((contest) =>
              Math.max(
                contest.updatedAt.getTime(),
                ...contest.announcements.map((announcement) => announcement.updatedAt.getTime()),
              ),
            ),
          ),
        )
      : null;

  const studentsReached = new Set(
    contests.flatMap((contest) =>
      contest.participations
        .filter((participation) => participation.role === "contestant")
        .map((participation) => participation.userId),
    ),
  ).size;

  const scheduleItems = contests
    .filter(
      (contest) =>
        contest.status === "UPCOMING" || contest.status === "ACTIVE" || contest.status === "DRAFT",
    )
    .slice(0, 4)
    .map((contest) => {
      const readinessItems = buildReadinessItems(contest);
      return {
        id: contest.id,
        title: contest.name,
        startsAt: contest.startsAt.toISOString(),
        endsAt: contest.endsAt?.toISOString() ?? null,
        status: titleCaseContestStatus(contest.status as "DRAFT" | "UPCOMING" | "ACTIVE"),
        readinessState: buildReadinessState(readinessItems),
      };
    });

  const announcements = snapshot.recentAnnouncements.map((item) => ({
    id: item.id,
    description: `TA ${item.author.firstName} ${item.author.lastName} posted “${item.title}” for ${item.contestName}`,
    timestamp: item.createdAt.toISOString(),
    tone: "highlight" as const,
  }));

  const performanceByContest = contests.map((contest) => {
    const contestantIds = new Set(
      contest.participations
        .filter((participation) => participation.role === "contestant")
        .map((participation) => participation.userId),
    );
    const relevantStatuses = contest.problemStatuses.filter((status) =>
      contestantIds.has(status.userId),
    );
    const solvedStatuses = relevantStatuses.filter((status) =>
      ["accepted", "solved"].includes(status.status.toLowerCase()),
    );

    return relevantStatuses.length === 0 ? 0 : (solvedStatuses.length / relevantStatuses.length) * 100;
  });

  const participationByContest = contests.map((contest) => contest.participants);

  const aiUsageByContest = contests.map((contest) => {
    const contestantIds = new Set(
      contest.participations
        .filter((participation) => participation.role === "contestant")
        .map((participation) => participation.userId),
    );
    const relevantSessions = contest.contestProblemSessions.filter((session) =>
      contestantIds.has(session.userId),
    );
    const eligibleSessions = relevantSessions.filter((session) => session.hintEligibleAt !== null);
    const triggeredSessions = eligibleSessions.filter((session) => session.hintTriggeredAt !== null);

    return eligibleSessions.length === 0
      ? 0
      : (triggeredSessions.length / eligibleSessions.length) * 100;
  });

  const midpoint = Math.max(1, Math.floor(contests.length / 2));
  const previousPerformance = average(performanceByContest.slice(0, midpoint));
  const recentPerformance = average(performanceByContest.slice(midpoint));
  const previousParticipation = average(participationByContest.slice(0, midpoint));
  const recentParticipation = average(participationByContest.slice(midpoint));
  const previousAiUsage = average(aiUsageByContest.slice(0, midpoint));
  const recentAiUsage = average(aiUsageByContest.slice(midpoint));

  return {
    role: "instructor",
    metadata: {
      contestsHeld: contests.length,
      problemsAuthored: snapshot.authoredProblemsCount,
      studentsReached,
      metricsUpdatedAt: metricsUpdatedAt?.toISOString() ?? null,
    },
    schedule: {
      upcoming: scheduleItems,
    },
    contests: {
      owned: contests
        .slice()
        .sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime())
        .map((contest) => {
          const contestantParticipations = contest.participations.filter(
            (participation) => participation.role === "contestant",
          );
          const assignedGroups = new Set(
            contestantParticipations
              .map((participation) => participation.experimentGroup)
              .filter((group): group is "A" | "B" | "C" => group !== null),
          );

          return {
            id: contest.id,
            title: contest.name,
            startsAt: contest.startsAt.toISOString(),
            status:
              contest.status === "DRAFT"
                ? "Draft"
                : contest.status === "UPCOMING"
                  ? "Upcoming"
                  : contest.status === "ACTIVE"
                    ? "Active"
                    : "Ended",
            participants: contest.participants,
            problemsCount: contest.contestProblems.length,
            groupsAssignedCount: assignedGroups.size,
            aiHintEnabled: contest.aiHintEnabled,
          };
        }),
    },
    announcements: {
      recent: announcements,
    },
    snapshots: {
      items: [
        {
          id: "overall-performance",
          label: "Overall Student Performance",
          value: `${Math.round(average(performanceByContest))}%`,
          caption: formatDeltaLabel(recentPerformance, previousPerformance),
        },
        {
          id: "overall-participation",
          label: "Overall Student Participation",
          value: `${Math.round(average(participationByContest))}`,
          caption: formatDeltaLabel(recentParticipation, previousParticipation, "students"),
        },
        {
          id: "overall-ai-usage",
          label: "Overall AI Usage",
          value: `${Math.round(average(aiUsageByContest))}%`,
          caption: formatDeltaLabel(recentAiUsage, previousAiUsage),
        },
      ],
    },
  };
}
