import { NextRequest } from "next/server";
import { handleGetAchievementIcon } from "@/server/api/s/achievement";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return handleGetAchievementIcon(request, id);
}
