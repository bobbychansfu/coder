import type {
  InstructorAnalysisResponse,
  SnapshotPreference,
  SnapshotType,
} from "@/lib/trpc/types/instructorAnalysis";
import type { InstructorAnalysisSnapshot } from "./repository";

function titleCaseContestStatus(
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED",
): "Draft" | "Upcoming" | "Active" | "Ended" {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UPCOMING":
      return "Upcoming";
    case "ACTIVE":
      return "Active";
    case "ENDED":
      return "Ended";
  }
}

function snapshotPreferenceLabel(value: SnapshotPreference): string {
  if (value === "latest") return "Latest Available";
  if (value === "preliminary") return "Preliminary (+5m)";
  return "Final (+15m)";
}

export function buildInstructorAnalysisResponse(
  snapshot: InstructorAnalysisSnapshot,
): InstructorAnalysisResponse {
  const selectedContest =
    snapshot.contests.find((contest) => contest.id === snapshot.selectedContestId) ?? null;

  return {
    role: "instructor",
    filters: {
      contests: snapshot.contests.map((contest) => ({
        value: contest.id,
        label: contest.name,
      })),
      problems: (selectedContest?.contestProblems ?? []).map((entry) => ({
        value: entry.problem.id,
        label: `${entry.problem.code} - ${entry.problem.title}`,
      })),
      snapshotPreferences: (["latest", "preliminary", "final"] as SnapshotPreference[]).map(
        (value) => ({
          value,
          label: snapshotPreferenceLabel(value),
        }),
      ),
    },
    selection: {
      contestId: snapshot.selectedContestId,
      problemId: snapshot.selectedProblemId,
      snapshotPreference: snapshot.snapshot.requestedPreference,
    },
    contest: {
      id: selectedContest?.id ?? null,
      title: selectedContest?.name ?? null,
      startsAt: selectedContest?.startsAt.toISOString() ?? null,
      endsAt: selectedContest?.endsAt?.toISOString() ?? null,
      status: selectedContest ? titleCaseContestStatus(selectedContest.status) : null,
    },
    snapshot: {
      requestedPreference: snapshot.snapshot.requestedPreference,
      resolvedType: snapshot.snapshot.resolvedType as SnapshotType | null,
      status: snapshot.snapshot.status,
      watermark: snapshot.snapshot.watermark?.toISOString() ?? null,
      computedAt: snapshot.snapshot.computedAt?.toISOString() ?? null,
      message: snapshot.snapshot.message,
    },
    contestGroupMetrics: {
      rows: snapshot.contestGroupRows,
    },
    problemStudentMetrics: {
      rows: snapshot.problemStudentRows,
    },
  };
}
