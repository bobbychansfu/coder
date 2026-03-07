import { NextRequest } from "next/server";
import { handleGetStudentInfo } from "@/server/api/s/info";

export async function GET(request: NextRequest) {
  return handleGetStudentInfo(request);
}
