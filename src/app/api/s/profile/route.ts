import { handleGetProfile } from "@/server/api/s/profile";

export async function GET() {
  return handleGetProfile();
}
