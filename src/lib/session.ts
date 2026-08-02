import { cookies } from "next/headers";
import { normalizeRole, type Role } from "@/lib/authz";
import { verifyCasSessionToken } from "@/lib/casAuthSession";
import { verifyDevSessionToken } from "@/lib/devAuthSession";
import { verifyGuestSessionToken } from "@/lib/guestAuthSession";
import { prisma } from "@/lib/prisma";

export interface CurrentUser {
  computingId: string;
  role: Role;
  displayName: string;
  identifier: string;
  accountType: "guest" | "sfu";
}

const AUTH_BACKEND_BASE_URL = process.env.AUTH_BACKEND_BASE_URL;
const AUTH_ME_PATH = process.env.AUTH_ME_PATH || "/me";
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
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        localCredential: { select: { username: true } },
      },
    });
    if (dbUser) {
      const isGuest = accountType === "guest" || Boolean(dbUser.localCredential);
      const guestUsername = dbUser.localCredential?.username;
      const hasLegacyCasName =
        !isGuest && dbUser.firstName === computingId && dbUser.lastName === "SFU User";

      if (hasLegacyCasName) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastName: "" },
        });
      }

      return {
        computingId,
        role,
        displayName: isGuest
          ? (guestUsername ?? computingId)
          : (`${dbUser.firstName} ${hasLegacyCasName ? "" : dbUser.lastName}`.trim() || computingId),
        identifier: isGuest ? (guestUsername ?? computingId) : dbUser.email,
        accountType: isGuest ? "guest" : "sfu",
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

  if (sessionCookieValue && GUEST_AUTH_COOKIE_SECRET) {
    const guestSession = verifyGuestSessionToken(sessionCookieValue, GUEST_AUTH_COOKIE_SECRET);
    if (guestSession) {
      const credential = await prisma.localCredential.findUnique({
        where: { userId: guestSession.userId },
        select: {
          enabled: true,
          expiresAt: true,
          user: { select: { computingId: true, role: true } },
        },
      });
      const active =
        credential?.enabled &&
        (!credential.expiresAt || credential.expiresAt.getTime() > Date.now()) &&
        credential.user.role === "GUEST" &&
        credential.user.computingId === guestSession.computingId;

      // Guest is an account type in the database, but intentionally receives the
      // existing student authorization profile throughout the application.
      if (active) return buildCurrentUser(guestSession.computingId, "student", "guest");
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

    return buildCurrentUser(computingId, role);
  } catch {
    return null;
  }
}
