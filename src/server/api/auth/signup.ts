import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createGuestSessionToken } from "@/lib/guestAuthSession";
import { hashLocalPassword } from "@/lib/localCredential";
import { NICKNAME_PATTERN, NICKNAME_RULE, NICKNAME_TAKEN } from "@/lib/nickname";
import { prisma } from "@/lib/prisma";
import { nicknameTaken } from "@/server/api/auth/nickname";
import { recordDailyLogin, syncStudentGamification } from "@/server/gamification/persistence";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const SESSION_TTL_SECONDS = 60 * 60 * 6;

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(50),
  lastName: z.string().trim().max(50).optional().default(""),
  nickname: z.string({ error: NICKNAME_RULE }).trim().regex(NICKNAME_PATTERN, NICKNAME_RULE),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters for your password.")
    .max(128, "Use at most 128 characters for your password."),
});

// SFU accounts belong to CAS. A password account on an SFU address would also
// block that student's own SFU login, because CAS refuses accounts with a password.
function isSfuEmail(email: string): boolean {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return domain === "sfu.ca" || domain.endsWith(".sfu.ca");
}

function emailTaken(): NextResponse {
  return NextResponse.json(
    { message: "An account with this email already exists. Sign in instead." },
    { status: 409 },
  );
}

/**
 * Self-service sign-up for students outside SFU (v0: no email confirmation).
 *
 * The account follows the guest pattern — a generated `guest_…` computing ID and a
 * LocalCredential whose username is the email — but with the STUDENT role and no
 * expiry, so it takes part in contests, teams and groups like any student.
 */
export async function handleSignup(request: NextRequest): Promise<NextResponse> {
  if (process.env.EXTERNAL_SIGNUP_ENABLED !== "true") {
    return NextResponse.json({ message: "Sign-up is not enabled." }, { status: 403 });
  }

  const secret = process.env.GUEST_AUTH_COOKIE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Sign-up is not configured." }, { status: 500 });
  }

  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid sign-up details." },
      { status: 400 },
    );
  }

  const { firstName, lastName, nickname, email, password } = parsed.data;
  if (isSfuEmail(email)) {
    return NextResponse.json(
      { message: "SFU students sign in with their SFU account instead." },
      { status: 400 },
    );
  }

  const [existingUser, existingCredential, nicknameInUse] = await Promise.all([
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.localCredential.findUnique({ where: { username: email }, select: { id: true } }),
    nicknameTaken(nickname),
  ]);
  if (existingUser || existingCredential) return emailTaken();
  if (nicknameInUse) return NextResponse.json({ message: NICKNAME_TAKEN }, { status: 409 });

  const passwordHash = await hashLocalPassword(password);
  let user: { id: string; computingId: string };
  try {
    user = await prisma.user.create({
      data: {
        computingId: `guest_${randomUUID()}`,
        email,
        firstName,
        lastName,
        nickname,
        role: "STUDENT",
        localCredential: { create: { username: email, passwordHash } },
      },
      select: { id: true, computingId: true },
    });
  } catch (error) {
    // Two sign-ups racing for the same email: the unique index decides.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return emailTaken();
    }
    throw error;
  }

  try {
    await recordDailyLogin(user.id);
    await syncStudentGamification(user.computingId);
  } catch (trackingError) {
    // Sign-up should still succeed if optional activity/gamification tracking is unavailable.
    console.error("Sign-up post-login tracking failed", trackingError);
  }

  const token = createGuestSessionToken(
    { userId: user.id, computingId: user.computingId, ttlSeconds: SESSION_TTL_SECONDS },
    secret,
  );
  const response = NextResponse.json(
    {
      message: "Account created.",
      user: { computingId: user.computingId, role: "student", accountType: "external" },
      expiresInSeconds: SESSION_TTL_SECONDS,
    },
    { status: 201 },
  );
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
