export interface Statistic {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  subtitleColor?: string;
}

export interface StatisticsResponse {
  statistics: Statistic[];
}
