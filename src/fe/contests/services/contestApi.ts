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

interface BackendContestProblem {
  id: string;
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
  const origin = await getApiOrigin();
  const cookieHeader = await getForwardedCookieHeader();

  const response = await fetch(`${origin}${path}`, {
    method: "GET",
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

export async function getStudentContestInfo() {
  return fetchContestApi<StudentContestInfoResponse>("/api/s/info");
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
