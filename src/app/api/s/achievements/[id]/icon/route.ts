import { NextRequest } from "next/server";
import { handleGetAchievementIcon } from "@/server/api/s/achievement";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetAchievementIcon(request, id);
}
