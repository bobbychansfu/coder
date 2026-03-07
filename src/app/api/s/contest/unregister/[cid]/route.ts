import { NextRequest } from "next/server";
import { handleUnregisterContest } from "@/server/api/s/contest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  return handleUnregisterContest(request, cid);
}
