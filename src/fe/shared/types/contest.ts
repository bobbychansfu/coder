export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface Contest {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  participants: number;
  difficulty: DifficultyLevel;
  rank: number;
  problemsSolved: string;
  score: string;
  timeTaken: string;
}

export interface UpcomingContest {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  timeUntil: string;
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
