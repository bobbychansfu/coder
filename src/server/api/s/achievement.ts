import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { dbHelpers } from "@/lib/db-helpers";
import { prisma } from "@/lib/prisma";

export async function handleGetAchievements(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [achievements, topicXp, totalXp] = await Promise.all([
      dbHelpers.getStudentAchievements(user.computingId),
      dbHelpers.getTopicXp(user.computingId),
      dbHelpers.getTotalProblemXp(user.computingId),
    ]);

    return NextResponse.json({
      computingId: user.computingId,
      achievements,
      topicXp,
      totalXp,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}

export async function handleGetAchievementIcon(
  request: NextRequest,
  id: string
) {
  try {
    const achievement = await prisma.achievement.findUnique({
      where: { id },
      select: { icon: true },
    });

    if (!achievement || !achievement.icon) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(achievement.icon, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error("Error fetching achievement icon:", error);
    return NextResponse.json({ error: "Failed to fetch icon" }, { status: 500 });
  }
}
