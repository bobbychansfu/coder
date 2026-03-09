import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";

export async function handleGetStudentInfo(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const computingId = user.computingId;
    const contests = await dbHelpers.findContestsForUser(computingId, "contestant");
    const contestsOpen = await dbHelpers.findOpenContestsForUser(computingId, "contestant");
    const role = user.role;

    return NextResponse.json({ computingId, contests, contestsOpen, role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
