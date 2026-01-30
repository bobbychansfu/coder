export interface Statistic {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  variant?: "success" | "neutral";
}

export interface StatisticsResponse {
  statistics: Statistic[];
}
