// Private contest allowlist entries are lowercased computing IDs or emails.

export function parseAllowlist(text: string): string[] {
  const entries = text
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(entries));
}

// The values an allowlist can name this user by
export function allowlistIdentifiersFor(user: { computingId: string; email: string }) {
  return Array.from(new Set([user.computingId.toLowerCase(), user.email.toLowerCase()]));
}

// What a join link adds for this user: email for email sign-ups, whose computing ID
// is a generated guest_… value, otherwise the computing ID
export function allowlistEntryFor(user: { computingId: string; email: string }) {
  return user.computingId.startsWith("guest_")
    ? user.email.toLowerCase()
    : user.computingId.toLowerCase();
}
