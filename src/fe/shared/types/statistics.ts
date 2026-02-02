import type { SvgIconComponent } from "@mui/icons-material";

export interface Statistic {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string | SvgIconComponent;
  variant?: "success" | "neutral" | "highlight";
  tone?: "info" | "highlight" | "neutral";
}

export interface StatisticsResponse {
  statistics: Statistic[];
}
