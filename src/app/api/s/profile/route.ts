import { NextRequest } from "next/server";
import { handleGetProfile } from "@/server/api/s/profile";

export async function GET(request: NextRequest) {
  return handleGetProfile(request);
}
