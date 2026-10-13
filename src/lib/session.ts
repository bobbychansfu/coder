import { cookies } from "next/headers";
import { localAccountAccess, normalizeRole, type Role } from "@/lib/authz";
import { verifyCasSessionToken } from "@/lib/casAuthSession";
import { verifyDevSessionToken } from "@/lib/devAuthSession";
import { verifyGuestSessionToken } from "@/lib/guestAuthSession";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  computingId: string;
  role: Role;
  displayName: string;
  identifier: string;
  // "external": a non-guest account that signs in with a Coder password.
  accountType: "guest" | "sfu" | "external";
}

const AUTH_BACKEND_BASE_URL = process.env.AUTH_BACKEND_BASE_URL;
const AUTH_ME_PATH = process.env.AUTH_ME_PATH || "/me";
const AUTH_ME_FALLBACK_ENABLED = process.env.AUTH_ME_FALLBACK_ENABLED === "true";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const AUTH_MODE = process.env.AUTH_MODE;
const CAS_AUTH_COOKIE_SECRET = process.env.CAS_AUTH_COOKIE_SECRET;
const DEV_AUTH_COOKIE_SECRET = process.env.DEV_AUTH_COOKIE_SECRET;
const GUEST_AUTH_COOKIE_SECRET = process.env.GUEST_AUTH_COOKIE_SECRET;

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

async function buildCurrentUser(
  computingId: string,
  role: Role,
  accountType: CurrentUser["accountType"] = "sfu",
): Promise<CurrentUser> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { computingId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        localCredential: { select: { username: true } },
      },
    });
    if (dbUser) {
      if (accountType === "guest") {
        // Guests are known by the username an admin gave them, not a name or email.
        const guestUsername = dbUser.localCredential?.username ?? computingId;
        return { computingId, role, displayName: guestUsername, identifier: guestUsername, accountType };
      }
      return {
        computingId,
        role,
        displayName: `${dbUser.firstName} ${dbUser.lastName}`.trim() || computingId,
        identifier: dbUser.email,
        accountType,
      };
    }
  } catch {
    // Authentication can still resolve with a safe identifier if profile lookup is unavailable.
  }

  return { computingId, role, displayName: computingId, identifier: computingId, accountType };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Password-based accounts (admin-made guests and self-registered users) share
  // one session token, checked against the database on every request.
  if (sessionCookieValue && GUEST_AUTH_COOKIE_SECRET) {
    const localSession = verifyGuestSessionToken(sessionCookieValue, GUEST_AUTH_COOKIE_SECRET);
    if (localSession) {
      const credential = await prisma.localCredential.findUnique({
        where: { userId: localSession.userId },
        select: {
          enabled: true,
          expiresAt: true,
          passwordChangedAt: true,
          user: { select: { computingId: true, role: true } },
        },
      });
      const access = credential ? localAccountAccess(credential.user.role) : null;
      const active =
        credential !== null &&
        access !== null &&
        credential.enabled &&
        (!credential.expiresAt || credential.expiresAt.getTime() > Date.now()) &&
        credential.user.computingId === localSession.computingId &&
        // A password change revokes every session issued before it.
        localSession.iat >= Math.floor(credential.passwordChangedAt.getTime() / 1000);

      if (active && access) {
        return buildCurrentUser(localSession.computingId, access.role, access.accountType);
      }
    }
  }

  if (AUTH_MODE === "dev" && sessionCookieValue && DEV_AUTH_COOKIE_SECRET) {
    const devSession = verifyDevSessionToken(sessionCookieValue, DEV_AUTH_COOKIE_SECRET);
    if (devSession) {
      return buildCurrentUser(devSession.computingId, devSession.role);
    }
  }

  if (AUTH_MODE === "cas" && sessionCookieValue && CAS_AUTH_COOKIE_SECRET) {
    const casSession = verifyCasSessionToken(sessionCookieValue, CAS_AUTH_COOKIE_SECRET);
    if (casSession) {
      return buildCurrentUser(casSession.computingId, casSession.role);
    }
  }

  // Legacy fallback: ask an external auth backend who this is. It is off unless
  // explicitly enabled, and it only ever receives the session cookie — never the
  // visitor's other cookies.
  if (!AUTH_ME_FALLBACK_ENABLED || !AUTH_BACKEND_BASE_URL || !sessionCookieValue) {
    return null;
  }

  const endpoint = new URL(AUTH_ME_PATH, AUTH_BACKEND_BASE_URL).toString();

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${sessionCookieValue}`,
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

    return buildCurrentUser(computingId, role);
  } catch {
    return null;
  }
}
