import { NextRequest } from "next/server";
import { handleGetContestDetails } from "@/server/api/s/contest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  return handleGetContestDetails(request, cid);
}
