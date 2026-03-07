import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";

export async function handleGetProfile(request: NextRequest) {
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

    const body = await request.json();
    const { fname, lname, nickname, student_number } = body;

    await dbHelpers.updateUser(user.computingId, {
      firstName: fname,
      lastName: lname,
      nickname,
      studentNumber: student_number,
    });

    const updatedUser = await dbHelpers.findUserByComputingId(user.computingId);

    return NextResponse.json({ message: "Profile updated", user: updatedUser });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 400 }
    );
  }
}
