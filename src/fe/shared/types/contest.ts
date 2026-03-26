export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type ContestStatus = "Closed" | "In Progress" | "Upcoming";

export interface Contest {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  participants: number;
  difficulty: DifficultyLevel;
  status: ContestStatus;
  rank: number;
  problemsSolved: string;
  score: string;
  timeTaken: string;
}

export interface UpcomingContest {
  id: string;
  title: string;
  courseCode?: string;
  date: string;
  timeUntil: string;
  readinessState?: "Ready" | "Needs Attention" | "Blocked";
}

export interface ContestAlert {
  title: string;
  description: string;
  isActive: boolean;
}

export interface ContestsResponse {
  pastContests: Contest[];
  upcomingContests: UpcomingContest[];
  alert?: ContestAlert;
}
