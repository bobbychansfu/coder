import { NextResponse } from "next/server";

/**
 * Example API Route
 *
 * This is a placeholder API route demonstrating the Next.js App Router API structure.
 * Replace this with your actual API endpoints.
 *
 * Access at: http://localhost:3000/api/hello
 */

export async function GET() {
  return NextResponse.json({
    message: "Hello from the API!",
    timestamp: new Date().toISOString(),
  });
}
