import "server-only";

import { cookies, headers } from "next/headers";

export interface BackendContestSummary {
  id: string;
  slug: string;
  name: string;
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "ENDED";
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  participants: number;
  published: boolean;
}

export interface StudentContestInfoResponse {
  computingId: string;
  contests: BackendContestSummary[];
  contestsOpen: BackendContestSummary[];
  role: string;
}

interface BackendProblemStatus {
  status: string;
  score: number;
}

interface BackendScoreboardCell {
  points?: number;
  time?: string;
  penalty?: number;
}

export interface BackendContestScoreboardRow {
  rank: number;
  name: string;
  solved: number;
  score: number;
  problems: Record<string, BackendScoreboardCell>;
  isCurrentUser?: boolean;
}

interface BackendContestProblem {
  id: string;
  code: string;
  title: string;
  difficulty: string;
  points: number | null;
  problemStatuses: BackendProblemStatus[];
}

export interface BackendContestProblemStatus {
  contestId: string;
  problemId: string;
  ordering: number;
  problem: BackendContestProblem;
}

export interface ContestProblemStatusResponse {
  computingId: string;
  contestProblemsStatus: BackendContestProblemStatus[];
  scoreboard: BackendContestScoreboardRow[];
  role: string;
}

export interface ContestProblemDetailResponse {
  computingId: string;
  cid: string;
  pid: string;
  problem: unknown;
  downloadContents: string[];
  role: string;
  htmlContents: string | string[];
}

export interface ContestProblemSubmissionsResponse {
  computingId: string;
  submissions: unknown[];
  problem: unknown;
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage?: string;
  errorReason?: "auth/session" | "base_url" | "non_ok_response" | "network" | "unknown";
  requestUrl?: string;
}

async function getApiOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    throw new Error("Missing request host header.");
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

async function getForwardedCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

async function fetchContestApi<T>(path: string): Promise<ApiResponse<T>> {
  let requestUrl = "";

  try {
    const origin = await getApiOrigin();
    requestUrl = `${origin}${path}`;
    const cookieHeader = await getForwardedCookieHeader();

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorReason =
        response.status === 401 || response.status === 403
          ? "auth/session"
          : "non_ok_response";

      return {
        ok: false,
        status: response.status,
        data: null,
        errorReason,
        errorMessage: `GET ${path} returned ${response.status}.`,
        requestUrl,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: (await response.json()) as T,
      requestUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    const errorReason =
      message.includes("Missing request host header") ? "base_url" : "network";

    return {
      ok: false,
      status: 500,
      data: null,
      errorReason,
      errorMessage: message,
      requestUrl,
    };
  }
}

async function mutateContestApi<T>(
  path: string,
  method: "POST" | "DELETE",
): Promise<ApiResponse<T>> {
  const origin = await getApiOrigin();
  const cookieHeader = await getForwardedCookieHeader();

  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, status: response.status, data: null };
  }

  return {
    ok: true,
    status: response.status,
    data: (await response.json()) as T,
  };
}

export async function getStudentContestInfo(refreshKey?: string) {
  const query = refreshKey ? `?refresh=${encodeURIComponent(refreshKey)}` : "";
  return fetchContestApi<StudentContestInfoResponse>(`/api/s/info${query}`);
}

export async function registerContest(contestId: string) {
  return mutateContestApi<{ message: string; registeredContests: BackendContestSummary[] }>(
    `/api/s/contest/register/${contestId}`,
    "POST",
  );
}

export async function getStudentContestInfoForRoute(contestId: string, role: string) {
  void contestId;
  void role;

  return getStudentContestInfo();
}

export async function getContestProblemStatus(contestId: string) {
  return fetchContestApi<ContestProblemStatusResponse>(`/api/s/contest/${contestId}`);
}

export async function getContestProblemDetail(contestId: string, problemId: string) {
  return fetchContestApi<ContestProblemDetailResponse>(`/api/s/problem/${contestId}/${problemId}`);
}

export async function getContestProblemSubmissions(contestId: string, problemId: string) {
  return fetchContestApi<ContestProblemSubmissionsResponse>(
    `/api/s/submissions/${contestId}/${problemId}`,
  );
}
