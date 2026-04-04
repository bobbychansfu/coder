import { NextRequest } from "next/server";
import { handleJudgeSubmissionStatuses } from "@/server/judge/managementRoutes";

export async function GET(req: NextRequest) {
  return handleJudgeSubmissionStatuses(req);
}
