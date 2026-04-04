import { NextRequest } from "next/server";
import { handleJudgeResultCallback } from "@/server/judge/managementRoutes";

export async function POST(req: NextRequest) {
  return handleJudgeResultCallback(req);
}
