export interface InstructorDashboardActivitySummary {
  id: string;
  description: string;
  timestamp: string | null;
  tone: "success" | "info" | "highlight";
}

export interface InstructorDashboardSnapshotSummary {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export interface InstructorDashboardResponse {
  role: "instructor";
  metadata: {
    contestsHeld: number;
    problemsAuthored: number;
    studentsReached: number;
    metricsUpdatedAt: string | null;
  };
  schedule: {
    upcoming: Array<{
      id: string;
      title: string;
      startsAt: string;
      endsAt: string | null;
      status: "Draft" | "Upcoming" | "Active";
      readinessState: "Ready" | "Needs Attention" | "Blocked";
    }>;
  };
  contests: {
    owned: Array<{
      id: string;
      title: string;
      startsAt: string;
      status: "Draft" | "Upcoming" | "Active" | "Ended";
      participants: number;
      problemsCount: number;
      groupsAssignedCount: number;
      aiHintEnabled: boolean;
    }>;
  };
  announcements: {
    recent: InstructorDashboardActivitySummary[];
  };
  snapshots: {
    items: InstructorDashboardSnapshotSummary[];
  };
}
