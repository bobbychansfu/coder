import { NextRequest } from "next/server";
import { handleGetSubmissionCode } from "@/server/api/s/problem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string; sid: string }> }
) {
  const { cid, sid } = await params;
  return handleGetSubmissionCode(request, cid, sid);
}
