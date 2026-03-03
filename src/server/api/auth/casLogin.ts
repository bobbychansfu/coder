import { NextResponse } from "next/server";

export async function handleCasLogin(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: "CAS login not configured yet",
    },
    { status: 501 },
  );
}
