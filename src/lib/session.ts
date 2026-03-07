import { cookies } from "next/headers";
import { normalizeRole, type Role } from "@/lib/authz";
import { verifyDevSessionToken } from "@/lib/devAuthSession";

export interface CurrentUser {
  computingId: string;
  role: Role;
}

const AUTH_BACKEND_BASE_URL = process.env.AUTH_BACKEND_BASE_URL;
const AUTH_ME_PATH = process.env.AUTH_ME_PATH || "/me";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const AUTH_MODE = process.env.AUTH_MODE;
const DEV_AUTH_COOKIE_SECRET = process.env.DEV_AUTH_COOKIE_SECRET;

function getComputingId(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.computingId,
    payload.computing_id,
    payload.computingID,
    payload.username,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function getRole(payload: Record<string, unknown>): Role | null {
  return normalizeRole(payload.role);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (AUTH_MODE === "dev" && sessionCookieValue && DEV_AUTH_COOKIE_SECRET) {
    const devSession = verifyDevSessionToken(sessionCookieValue, DEV_AUTH_COOKIE_SECRET);
    if (devSession) {
      return {
        computingId: devSession.computingId,
        role: devSession.role,
      };
    }
  }

  const allCookies = cookieStore.getAll();
  if (allCookies.length === 0) {
    return null;
  }
  const forwardedCookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join("; ");

  if (!AUTH_BACKEND_BASE_URL) {
    return null;
  }

  const endpoint = new URL(AUTH_ME_PATH, AUTH_BACKEND_BASE_URL).toString();

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Cookie: forwardedCookieHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as unknown;
    if (!body || typeof body !== "object") {
      return null;
    }

    const payload = body as Record<string, unknown>;
    const computingId = getComputingId(payload);
    const role = getRole(payload);

    if (!computingId || !role) {
      return null;
    }

    return { computingId, role };
  } catch {
    return null;
  }
}
