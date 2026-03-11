import { NextRequest, NextResponse } from "next/server";
import { normalizeRole } from "@/lib/authz";
import { createDevSessionToken } from "@/lib/devAuthSession";
import { demoUsers } from "@/fe/auth/constants/demoUsers";
import { prisma } from "@/lib/prisma";
import { recordDailyLogin } from "./metadata/persistence";
import { syncStudentGamification } from "./metadata/student";

const DEV_SESSION_TTL_SECONDS = 60 * 60 * 6;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

function isDevAuthEnabled(): boolean {
  return process.env.AUTH_MODE === "dev";
}

interface DevLoginRequestBody {
  email?: unknown;
  role?: unknown;
}

export async function handleDevLogin(request: NextRequest): Promise<NextResponse> {
  if (!isDevAuthEnabled()) {
    return NextResponse.json(
      { message: "Dev auth is disabled outside dev mode." },
      { status: 403 },
    );
  }

  const secret = process.env.DEV_AUTH_COOKIE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "DEV_AUTH_COOKIE_SECRET is required for dev login." },
      { status: 500 },
    );
  }

  let body: DevLoginRequestBody;
  try {
    body = (await request.json()) as DevLoginRequestBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.role !== "string") {
    return NextResponse.json(
      { message: "Both email and role are required." },
      { status: 400 },
    );
  }

  const email = body.email;
  const role = normalizeRole(body.role);
  const matchedUser = demoUsers.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );

  if (!matchedUser) {
    return NextResponse.json({ message: "No access" }, { status: 401 });
  }

  const expectedRole = normalizeRole(matchedUser.role);
  if (!role || !expectedRole || role !== expectedRole) {
    return NextResponse.json({ message: "No access" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { computingId: matchedUser.computingId },
    select: { id: true },
  });

  if (dbUser) {
    await recordDailyLogin(dbUser.id);
    await syncStudentGamification(matchedUser.computingId);
  }

  const { token } = createDevSessionToken(
    {
      computingId: matchedUser.computingId,
      email: matchedUser.email,
      role: expectedRole,
      ttlSeconds: DEV_SESSION_TTL_SECONDS,
    },
    secret,
  );

  const response = NextResponse.json(
    {
      message: "Dev login successful.",
      user: {
        computingId: matchedUser.computingId,
        email: matchedUser.email,
        role: expectedRole,
      },
      expiresInSeconds: DEV_SESSION_TTL_SECONDS,
    },
    { status: 200 },
  );

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEV_SESSION_TTL_SECONDS,
  });

  return response;
}
