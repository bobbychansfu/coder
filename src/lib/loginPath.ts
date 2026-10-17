import { headers } from "next/headers";
import { withNextPath } from "@/lib/safeNextPath";

// Set by the auth guard in src/proxy.ts to the path being requested.
export const REQUEST_PATH_HEADER = "x-request-path";

/** The login page, returning to the requested page after sign-in. */
export async function loginPath(): Promise<string> {
  return withNextPath("/login", (await headers()).get(REQUEST_PATH_HEADER));
}
