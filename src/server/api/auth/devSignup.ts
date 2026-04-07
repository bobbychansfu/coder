import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDevSessionToken } from "@/lib/devAuthSession";
import { prisma } from "@/lib/prisma";
import { recordDailyLogin, syncStudentGamification } from "@/server/gamification/persistence";

const DEV_SESSION_TTL_SECONDS = 60 * 60 * 6;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

function isDevAuthEnabled(): boolean {
  return process.env.AUTH_MODE === "dev";
}

const devSignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  computingId: z.string().trim().min(1, "Computing ID is required."),
  email: z.string().trim().email("Enter a valid email address."),
  studentNumber: z.string().trim().optional().default(""),
});

function splitName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Student";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

export async function handleDevSignup(request: NextRequest): Promise<NextResponse> {
  if (!isDevAuthEnabled()) {
    return NextResponse.json(
      { message: "Dev signup is disabled outside dev mode." },
      { status: 403 },
    );
  }

  const secret = process.env.DEV_AUTH_COOKIE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "DEV_AUTH_COOKIE_SECRET is required for dev signup." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = devSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid signup data." },
      { status: 400 },
    );
  }

  const name = parsed.data.name;
  const computingId = parsed.data.computingId.toLowerCase();
  const email = parsed.data.email.toLowerCase();
  const studentNumber = parsed.data.studentNumber;
  const { firstName, lastName } = splitName(name);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ computingId }, { email }],
    },
    select: {
      computingId: true,
      email: true,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        message:
          existingUser.computingId === computingId
            ? "That computing ID is already in use."
            : "That email is already in use.",
      },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      computingId,
      email,
      studentNumber: studentNumber || null,
      role: "STUDENT",
    },
    select: {
      id: true,
      computingId: true,
      email: true,
    },
  });

  await recordDailyLogin(user.id);
  await syncStudentGamification(user.computingId);

  const { token } = createDevSessionToken(
    {
      computingId: user.computingId,
      email: user.email,
      role: "student",
      ttlSeconds: DEV_SESSION_TTL_SECONDS,
    },
    secret,
  );

  const response = NextResponse.json(
    {
      message: "Dev signup successful.",
      user: {
        computingId: user.computingId,
        email: user.email,
        role: "student",
      },
      expiresInSeconds: DEV_SESSION_TTL_SECONDS,
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
    maxAge: DEV_SESSION_TTL_SECONDS,
  });

  return response;
}
