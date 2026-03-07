import { NextRequest } from "next/server";
import { handleGetAllSubmissions } from "@/server/api/s/problem";

export async function GET(request: NextRequest) {
  return handleGetAllSubmissions(request);
}
