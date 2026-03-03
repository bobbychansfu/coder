import type { Role } from "@/lib/authz";
import { handleForbidden, redirectToLogin, type ForbiddenMode } from "@/lib/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiPrefix = "/s" | "/i" | "/a";
type RoleIntent = "general" | "privileged" | "admin";

export interface ApiClientErrorDetails {
  status: number;
  url: string;
  details: unknown;
}

export class ApiClientError extends Error {
  status: number;
  url: string;
  details: unknown;

  constructor(message: string, details: ApiClientErrorDetails) {
    super(message);
    this.name = "ApiClientError";
    this.status = details.status;
    this.url = details.url;
    this.details = details.details;
  }
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  cookieHeader?: string;
  forbiddenMode?: ForbiddenMode;
  onForbiddenToast?: (message: string) => void;
  nextPath?: string;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

function ensureAllowedPath(path: string): void {
  if (path.startsWith("/m/") || path === "/m") {
    throw new ApiClientError("Blocked internal system route /m/*", {
      status: 400,
      url: path,
      details: "Browser must not call internal judging endpoints.",
    });
  }
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function parseErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch {
    return null;
  }
}

function rolePrefix(role: Role, intent: RoleIntent = "general"): ApiPrefix {
  if (role === "student") {
    return "/s";
  }

  if (role === "ta" || role === "instructor") {
    return intent === "privileged" ? "/i" : "/s";
  }

  if (intent === "admin") {
    return "/a";
  }

  if (intent === "privileged") {
    return "/i";
  }

  return "/s";
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const normalizedPath = normalizePath(path);
  ensureAllowedPath(normalizedPath);
  const url = buildUrl(normalizedPath);

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.cookieHeader) {
    headers.set("Cookie", options.cookieHeader);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    redirectToLogin(options.nextPath);
  }

  if (response.status === 403) {
    handleForbidden({
      mode: options.forbiddenMode ?? "redirect",
      onToast: options.onForbiddenToast,
    });
  }

  if (!response.ok) {
    const details = await parseErrorBody(response);
    throw new ApiClientError(`API request failed: ${response.status}`, {
      status: response.status,
      url,
      details,
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function callAsRole<TResponse, TBody = unknown>(
  role: Role,
  route: string,
  options: ApiRequestOptions<TBody> & { intent?: RoleIntent } = {},
): Promise<TResponse> {
  const prefix = rolePrefix(role, options.intent);
  const normalizedRoute = normalizePath(route);
  return apiRequest<TResponse, TBody>(`${prefix}${normalizedRoute}`, options);
}

export function createRoleApi(role: Role) {
  return {
    get<TResponse>(route: string, options?: ApiRequestOptions) {
      return callAsRole<TResponse>(role, route, { ...options, method: "GET" });
    },
    post<TResponse, TBody = unknown>(
      route: string,
      body: TBody,
      options?: ApiRequestOptions<TBody> & { intent?: RoleIntent },
    ) {
      return callAsRole<TResponse, TBody>(role, route, {
        ...options,
        method: "POST",
        body,
      });
    },
    put<TResponse, TBody = unknown>(
      route: string,
      body: TBody,
      options?: ApiRequestOptions<TBody> & { intent?: RoleIntent },
    ) {
      return callAsRole<TResponse, TBody>(role, route, {
        ...options,
        method: "PUT",
        body,
      });
    },
    delete<TResponse>(route: string, options?: ApiRequestOptions & { intent?: RoleIntent }) {
      return callAsRole<TResponse>(role, route, { ...options, method: "DELETE" });
    },
  };
}

export const studentApi = createRoleApi("student");
export const instructorApi = createRoleApi("instructor");
export const adminApi = createRoleApi("admin");
