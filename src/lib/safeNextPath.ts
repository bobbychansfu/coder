const DEFAULT_NEXT_PATH = "/dashboard";
const SAME_SITE_BASE = "http://coder.invalid";

/**
 * Returns `next` only when it is a path on this site, otherwise `fallback`.
 *
 * A leading "/" is not enough: browsers treat "\" as "/", so "/\evil.com" means
 * "//evil.com" — another host. Control characters are rejected for the same
 * reason, and the final origin check catches anything else that escapes.
 */
export function safeNextPath(next: unknown, fallback: string = DEFAULT_NEXT_PATH): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  if (/[\\\u0000-\u001f\u007f]/.test(next)) {
    return fallback;
  }

  try {
    return new URL(next, SAME_SITE_BASE).origin === SAME_SITE_BASE ? next : fallback;
  } catch {
    return fallback;
  }
}

/** Adds `?next=` to an auth page link, so the return path survives sign-in. */
export function withNextPath(href: string, next: unknown): string {
  const nextPath = safeNextPath(next, "");
  return nextPath ? `${href}?next=${encodeURIComponent(nextPath)}` : href;
}
