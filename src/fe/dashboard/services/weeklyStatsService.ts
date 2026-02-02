import { WeeklyStat, WeeklyStatsResponse } from "@/fe/shared/types/weeklyStats";
import { mockWeeklyStats } from "@/fe/dashboard/data/weeklyStats";
import { apiFetch, USE_MOCK_DATA } from "@/fe/shared/services/api";

/**
 * Weekly Stats Service
 *
 * Fetch user's statistics for the current week
 *
 * API Endpoint: GET /api/stats/weekly
 *
 * To switch to real API:
 * 1. Set USE_MOCK_DATA to false in api.ts
 * 2. Implement GET /api/stats/weekly on your backend
 * 3. Return data in WeeklyStatsResponse format
 */

export async function getWeeklyStats(): Promise<WeeklyStat[]> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockWeeklyStats;
  }

  const response = await apiFetch<WeeklyStatsResponse>("/stats/weekly");
  return response.stats;
}
