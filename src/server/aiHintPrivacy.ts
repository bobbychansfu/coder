// The hint service forwards everything to a third-party model, so nothing it receives
// may identify the student. Coder is the only side that knows who is asking.

export interface StudentIdentity {
  computingId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  studentNumber?: string | null;
}

export const REDACTED = "[redacted]";

// Comments and string literals, where a name in a student's code would be personal
// rather than a variable such as `max` or `long`
const COMMENTS_AND_STRINGS: Record<string, RegExp> = {
  python: /#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g,
  other: /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g,
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactWords(text: string, words: string[]) {
  const usable = [...new Set(words.map((w) => w.trim()).filter((w) => w.length >= 2))]
    .sort((a, b) => b.length - a.length);
  if (usable.length === 0) {
    return text;
  }
  // Whole words only, ignoring case: "abc12" must not touch "abc123"
  const pattern = new RegExp(
    `(?<![A-Za-z0-9])(?:${usable.map(escapeRegExp).join("|")})(?![A-Za-z0-9])`,
    "gi",
  );
  return text.replace(pattern, REDACTED);
}

// Identifiers that are never legitimate code go everywhere; names only inside comments and strings.
export function redactStudentCode(code: string, language: string, who: StudentIdentity) {
  const emailLocalPart = who.email?.split("@")[0];
  const strong = [who.computingId, who.email, emailLocalPart, who.studentNumber].filter(
    (value): value is string => Boolean(value),
  );
  const names = [who.firstName, who.lastName, who.nickname].filter(
    (value): value is string => Boolean(value),
  );
  const fullNames = who.firstName && who.lastName ? [`${who.firstName} ${who.lastName}`] : [];

  // Strong identifiers first: a name removed first could break up an email ("dylan.04@sfu.ca")
  const commentsAndStrings =
    COMMENTS_AND_STRINGS[language === "python" ? "python" : "other"];
  return redactWords(code, strong).replace(commentsAndStrings, (segment) =>
    redactWords(segment, [...fullNames, ...names]),
  );
}
