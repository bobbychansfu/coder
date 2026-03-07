import { NextRequest } from "next/server";
import { handleUpdateProfile } from "@/server/api/s/profile";

export async function POST(request: NextRequest) {
  return handleUpdateProfile(request);
}
