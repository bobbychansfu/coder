import { NextRequest } from "next/server";
import { handleEnterContest } from "@/server/api/s/contest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  return handleEnterContest(request, cid);
}
