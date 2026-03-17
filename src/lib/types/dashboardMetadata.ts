import type { Badge } from "@/fe/shared/types/badge";
import type { Statistic } from "@/fe/shared/types/statistics";
import type { WeeklyStat } from "@/fe/shared/types/weeklyStats";

export interface StudentDashboardMetadata {
  statistics: Statistic[];
  weeklyStats: WeeklyStat[];
  badges: Badge[];
}
