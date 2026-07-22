import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { hashLocalPassword } from "@/lib/localCredential";
import { prisma } from "@/lib/prisma";

const createGuestSchema = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  firstName: z.string().trim().optional().default("Guest"),
  lastName: z.string().trim().optional().default("User"),
  password: z.string().min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function handleListGuestUsers(): Promise<NextResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const now = new Date();
  const expiredUsers = await prisma.user.findMany({
    where: {
      role: "GUEST",
      localCredential: { is: { expiresAt: { lte: now } } },
    },
    select: { id: true },
  });
  if (expiredUsers.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: expiredUsers.map((user) => user.id) } } });
  }

  const guests = await prisma.localCredential.findMany({
    where: { user: { role: "GUEST" } },
    orderBy: { createdAt: "desc" },
    select: {
      username: true,
      enabled: true,
      expiresAt: true,
      lastLoginAt: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({
    users: guests.map((guest) => ({
      id: guest.user.id,
      name: `${guest.user.firstName} ${guest.user.lastName}`.trim(),
      username: guest.username,
      role: "guest",
      enabled: guest.enabled,
      expiresAt: guest.expiresAt?.toISOString() ?? null,
      lastActive: guest.lastLoginAt?.toISOString() ?? null,
    })),
  });
}

export async function handleCreateGuestUser(request: NextRequest): Promise<NextResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ message: "Admin access required." }, { status: 403 });

  const parsed = createGuestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid guest account data." },
      { status: 400 },
    );
  }

  const { username, firstName, lastName, password } = parsed.data;
  const internalId = randomUUID();
  const computingId = `guest_${internalId}`;
  const email = `${internalId}@guest.local`;
  const passwordHash = await hashLocalPassword(password);

  try {
    const existingCredential = await prisma.localCredential.findUnique({
      where: { username },
      select: { id: true, userId: true, expiresAt: true },
    });
    const isExpired =
      existingCredential?.expiresAt && existingCredential.expiresAt.getTime() <= Date.now();

    if (existingCredential && !isExpired) {
      return NextResponse.json({ message: "That guest username is already in use." }, { status: 409 });
    }

    const user = await prisma.$transaction(async (tx) => {
      if (existingCredential) {
        await tx.user.delete({ where: { id: existingCredential.userId } });
      }

      return tx.user.create({
        data: {
          computingId,
          email,
          firstName: firstName || "Guest",
          lastName: lastName || "User",
          role: "GUEST",
          localCredential: {
            create: {
              username,
              passwordHash,
              expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
            },
          },
        },
        select: { id: true, computingId: true, firstName: true, lastName: true, role: true },
      });
    });
    return NextResponse.json(
      { message: existingCredential ? "Expired guest account deleted and replaced." : "Guest account created.", user },
      { status: 201 },
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code
        : null;

    if (code === "P2002") {
      return NextResponse.json({ message: "That guest username is already in use." }, { status: 409 });
    }

    if (code === "P2021" || code === "P2022") {
      return NextResponse.json(
        { message: "Guest database tables are not ready. Apply the latest Prisma migration." },
        { status: 503 },
      );
    }

    console.error("[admin:guest-users] failed to create guest account", { code, error });
    return NextResponse.json({ message: "Unable to create guest account." }, { status: 500 });
  }
}
