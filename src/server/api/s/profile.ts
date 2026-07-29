import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import { z } from "zod";

const updateProfileSchema = z.object({
  fname: z.string().trim().min(1).max(50),
  lname: z.string().trim().min(1).max(50),
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
