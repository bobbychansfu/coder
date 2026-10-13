import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { localAccountAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { hashLocalPassword, verifyLocalPassword } from "@/lib/localCredential";
import { createGuestSessionToken } from "@/lib/guestAuthSession";
import { recordDailyLogin, syncStudentGamification } from "@/server/gamification/persistence";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const GUEST_SESSION_TTL_SECONDS = 60 * 60 * 6;
// Accepts a guest username or the email a self-registered account uses as its username.
const guestLoginSchema = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

// Checking unknown usernames against a throwaway hash keeps them as slow as a wrong
// password, so response timing does not reveal which accounts exist.
let dummyPasswordHash: Promise<string> | null = null;
function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashLocalPassword("not-a-real-password");
  return dummyPasswordHash;
}

function loginError(): NextResponse {
  return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
}

export async function handleGuestLogin(request: NextRequest): Promise<NextResponse> {
  if (process.env.GUEST_LOGIN_ENABLED !== "true") {
    return NextResponse.json({ message: "Guest login is disabled." }, { status: 403 });
  }

  const secret = process.env.GUEST_AUTH_COOKIE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Guest login is not configured." }, { status: 500 });
  }

  const parsed = guestLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return loginError();

  const credential = await prisma.localCredential.findUnique({
    where: { username: parsed.data.username },
    include: { user: true },
  });
  const access = credential ? localAccountAccess(credential.user.role) : null;
  const usable =
    credential !== null &&
    access !== null &&
    credential.enabled &&
    (!credential.expiresAt || credential.expiresAt.getTime() > Date.now());

  const passwordMatches = await verifyLocalPassword(
    parsed.data.password,
    usable ? credential.passwordHash : await getDummyPasswordHash(),
  );
  if (!usable || !access || !passwordMatches) return loginError();

  await prisma.localCredential.update({
    where: { id: credential.id },
    data: { lastLoginAt: new Date() },
  });

  if (access.accountType === "external") {
    try {
      await recordDailyLogin(credential.user.id);
      if (access.role === "student") await syncStudentGamification(credential.user.computingId);
    } catch (error) {
      // Login should still succeed if optional activity/gamification tracking is unavailable.
      console.error("Local login post-login tracking failed", error);
    }
  }

  const token = createGuestSessionToken(
    { userId: credential.user.id, computingId: credential.user.computingId, ttlSeconds: GUEST_SESSION_TTL_SECONDS },
    secret,
  );
  const response = NextResponse.json({
    message: access.accountType === "guest" ? "Guest login successful." : "Login successful.",
    user: { computingId: credential.user.computingId, role: access.role, accountType: access.accountType },
    expiresInSeconds: GUEST_SESSION_TTL_SECONDS,
  });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_SESSION_TTL_SECONDS,
  });
  return response;
}
