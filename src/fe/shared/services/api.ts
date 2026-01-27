/**
 * Base API configuration
 *
 * To switch from mock data to real API:
 * 1. Update API_BASE_URL to your backend URL
 * 2. Set USE_MOCK_DATA to false
 * 3. Ensure your API endpoints match the paths below
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const USE_MOCK_DATA = true; // Set to false when backend is ready

/**
 * Generic API fetch wrapper
 */
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
