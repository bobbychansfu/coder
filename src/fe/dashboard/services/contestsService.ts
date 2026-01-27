import { Contest, UpcomingContest, ContestAlert, ContestsResponse } from "@/fe/shared/types";
import { mockPastContests, mockUpcomingContests, mockContestAlert } from "@/fe/dashboard/data";
import { apiFetch, USE_MOCK_DATA } from "@/fe/shared/services/api";

/**
 * Contests Service
 *
 * Fetch past contests, upcoming contests, and active contest alerts
 *
 * API Endpoints:
 * - GET /api/contests/past
 * - GET /api/contests/upcoming
 * - GET /api/contests/alert
 *
 * To switch to real API:
 * 1. Set USE_MOCK_DATA to false in api.ts
 * 2. Implement the endpoints on your backend
 * 3. Return data in the specified formats
 */

export async function getPastContests(): Promise<Contest[]> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockPastContests;
  }

  const response = await apiFetch<{ contests: Contest[] }>("/contests/past");
  return response.contests;
}

export async function getUpcomingContests(): Promise<UpcomingContest[]> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockUpcomingContests;
  }

  const response = await apiFetch<{ contests: UpcomingContest[] }>("/contests/upcoming");
  return response.contests;
}

export async function getContestAlert(): Promise<ContestAlert | null> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockContestAlert.isActive ? mockContestAlert : null;
  }

  try {
    const response = await apiFetch<{ alert: ContestAlert | null }>("/contests/alert");
    return response.alert;
  } catch {
    return null;
  }
}
