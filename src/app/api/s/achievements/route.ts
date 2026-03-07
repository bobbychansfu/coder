import { NextRequest } from "next/server";
import { handleGetAchievements } from "@/server/api/s/achievement";

export async function GET(request: NextRequest) {
  return handleGetAchievements(request);
}
