export interface MetadataBadgeSummary {
  code: string;
  name: string;
  earnedAt: string | null;
}

export interface StudentDashboardMetadataResponse {
  role: "student";
  cards: {
    totalSolved: number;
    participationContests: number;
    totalScore: number;
    rankParticipationNumber: number | null;
    rankPointsNumber: number | null;
  };
  participation: {
    activeDays7d: number;
    submissions7d: number;
    loginStreakDays: number;
  };
  weekly: {
    problemsSolved7d: number;
    contestsParticipated7d: number;
    points7d: number;
    timeSpentMinutes7d: number;
  };
  badges: {
    earned: MetadataBadgeSummary[];
  };
}
