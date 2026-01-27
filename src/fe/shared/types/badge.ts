export interface Badge {
  id: string;
  icon: string;
  name: string;
  color: string;
  earnedDate?: string;
}

export interface BadgesResponse {
  badges: Badge[];
}
