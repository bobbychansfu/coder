import { NextRequest } from "next/server";
import { handleRegisterContest } from "@/server/api/s/contest";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  return handleRegisterContest(request, cid);
}
