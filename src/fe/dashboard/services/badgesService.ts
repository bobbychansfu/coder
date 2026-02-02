import { Badge, BadgesResponse } from "@/fe/shared/types/badge";
import { mockBadges } from "@/fe/dashboard/data/badges";
import { apiFetch, USE_MOCK_DATA } from "@/fe/shared/services/api";

/**
 * Badges Service
 *
 * Fetch user's recent badges/achievements
 *
 * API Endpoint: GET /api/badges/recent
 *
 * To switch to real API:
 * 1. Set USE_MOCK_DATA to false in api.ts
 * 2. Implement GET /api/badges/recent on your backend
 * 3. Return data in BadgesResponse format
 */

export async function getRecentBadges(): Promise<Badge[]> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockBadges;
  }

  const response = await apiFetch<BadgesResponse>("/badges/recent");
  return response.badges;
}
