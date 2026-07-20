import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyLocalPassword } from "@/lib/localCredential";
import { createGuestSessionToken } from "@/lib/guestAuthSession";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";
const GUEST_SESSION_TTL_SECONDS = 60 * 60 * 6;
const guestLoginSchema = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

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
  const active =
    credential?.enabled &&
    credential.user.role === "GUEST" &&
    (!credential.expiresAt || credential.expiresAt.getTime() > Date.now());

  if (!credential || !active) return loginError();
  if (!(await verifyLocalPassword(parsed.data.password, credential.passwordHash))) return loginError();

  await prisma.localCredential.update({
    where: { id: credential.id },
    data: { lastLoginAt: new Date() },
  });

  const token = createGuestSessionToken(
    { userId: credential.user.id, computingId: credential.user.computingId, ttlSeconds: GUEST_SESSION_TTL_SECONDS },
    secret,
  );
  const response = NextResponse.json({
    message: "Guest login successful.",
    user: { computingId: credential.user.computingId, role: "student", accountType: "guest" },
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
