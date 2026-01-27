import { Statistic, StatisticsResponse } from "@/fe/shared/types";
import { mockStatistics } from "@/fe/dashboard/data";
import { apiFetch, USE_MOCK_DATA } from "@/fe/shared/services/api";

/**
 * Statistics Service
 *
 * Fetch user statistics (Total Solved, Current Streak, Total XP, Global Rank)
 *
 * API Endpoint: GET /api/statistics
 *
 * To switch to real API:
 * 1. Set USE_MOCK_DATA to false in api.ts
 * 2. Implement GET /api/statistics on your backend
 * 3. Return data in StatisticsResponse format
 */

export async function getStatistics(): Promise<Statistic[]> {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockStatistics;
  }

  const response = await apiFetch<StatisticsResponse>("/statistics");
  return response.statistics;
}
