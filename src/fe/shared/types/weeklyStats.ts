export interface WeeklyStat {
  label: string;
  value: string | number;
  isPositive?: boolean;
}

export interface WeeklyStatsResponse {
  stats: WeeklyStat[];
}
