import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import { NICKNAME_PATTERN, NICKNAME_RULE, NICKNAME_TAKEN } from "@/lib/nickname";
import { nicknameTaken } from "@/server/api/auth/nickname";
import { z } from "zod";

const updateProfileSchema = z.object({
  fname: z.string().trim().min(1).max(50),
  lname: z.string().trim().max(50).optional().default(""),
  nickname: z.string().trim().max(40).optional().default(""),
  student_number: z.string().trim().max(20).optional(),
});

export async function handleGetProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await dbHelpers.findUserByComputingId(user.computingId);
    const activities = await dbHelpers.getUserActivities(user.computingId);

    return NextResponse.json({ user: userData, activities });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function handleUpdateProfile(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide valid profile information." },
        { status: 400 },
      );
    }
    const { fname, lname, nickname, student_number } = parsed.data;

    // Email sign-ups chose an @handle at registration, so a new one must be a valid, free handle.
    // SFU accounts keep free-form nicknames for now.
    if (user.accountType === "external") {
      const current = await dbHelpers.findUserByComputingId(user.computingId);
      if (current && nickname !== (current.nickname ?? "")) {
        if (!NICKNAME_PATTERN.test(nickname)) {
          return NextResponse.json({ error: NICKNAME_RULE }, { status: 400 });
        }
        if (await nicknameTaken(nickname, current.id)) {
          return NextResponse.json({ error: NICKNAME_TAKEN }, { status: 409 });
        }
      }
    }

    await dbHelpers.updateUser(user.computingId, {
      firstName: fname,
      lastName: lname,
      nickname: nickname || null,
      studentNumber:
        user.role === "student"
          ? student_number || null
          : undefined,
    });

    const updatedUser = await dbHelpers.findUserByComputingId(user.computingId);

    return NextResponse.json({ message: "Profile updated", user: updatedUser });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to update profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
