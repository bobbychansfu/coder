import { NextRequest } from "next/server";
import { handleGetClosedContestInfo } from "@/server/api/s/contest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  return handleGetClosedContestInfo(request, cid);
}
