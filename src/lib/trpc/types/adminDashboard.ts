export interface AdminDashboardActivitySummary {
  id: string;
  description: string;
  timestamp: string | null;
  tone: "success" | "info" | "warning";
}

export interface AdminDashboardSnapshotSummary {
  id: string;
  label: string;
  value: string;
  caption: string;
}

export interface AdminDashboardResponse {
  role: "admin";
  metadata: {
    totalUsers: number;
    activeContests: number;
    upcomingContests: number;
    problemBankSize: number;
    submissionsLast24Hours: number;
    pendingSubmissions: number;
    roleCounts: {
      students: number;
      instructors: number;
      admins: number;
    };
    metricsUpdatedAt: string | null;
  };
  schedule: {
    upcoming: Array<{
      id: string;
      title: string;
      classSection: string | null;
      startsAt: string;
      endsAt: string | null;
      status: "Draft" | "Upcoming" | "Active";
      readinessState: "Ready" | "Needs Attention" | "Blocked";
    }>;
  };
  contests: {
    overview: Array<{
      id: string;
      title: string;
      instructorName: string;
      startsAt: string;
      status: "Draft" | "Upcoming" | "Active" | "Ended";
      visibility: "Public" | "Private" | "Course Only";
      participants: number;
      problemsCount: number;
      announcementsCount: number;
      published: boolean;
    }>;
  };
  activity: {
    recent: AdminDashboardActivitySummary[];
  };
  snapshots: {
    items: AdminDashboardSnapshotSummary[];
  };
}
