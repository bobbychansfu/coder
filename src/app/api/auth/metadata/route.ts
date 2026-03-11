import { NextRequest, NextResponse } from "next/server";
import { handleMetadataGet, handleMetadataPost } from "@/server/api/auth/metadata";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  void request;
  return handleMetadataGet();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleMetadataPost(request);
}
