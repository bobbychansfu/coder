import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/authz";

const CAS_AUTH_VERSION = "cas-auth-v1";

export interface CasSessionPayload {
  v: typeof CAS_AUTH_VERSION;
  computingId: string;
  role: Role;
  iat: number;
  exp: number;
}

function encode(value: Buffer | string): string {
  return (Buffer.isBuffer(value) ? value : Buffer.from(value)).toString("base64url");
}

function sign(payload: string, secret: string): string {
  return encode(createHmac("sha256", secret).update(payload).digest());
}

export function createCasSessionToken(
  input: Pick<CasSessionPayload, "computingId" | "role"> & { ttlSeconds: number },
  secret: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: CasSessionPayload = {
    v: CAS_AUTH_VERSION,
    computingId: input.computingId,
    role: input.role,
    iat: now,
    exp: now + input.ttlSeconds,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyCasSessionToken(token: string, secret: string): CasSessionPayload | null {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expected = Buffer.from(sign(encodedPayload, secret));
  const actual = Buffer.from(encodedSignature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as CasSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (
      payload.v !== CAS_AUTH_VERSION ||
      !payload.computingId ||
      !["student", "instructor", "admin"].includes(payload.role) ||
      payload.exp <= now
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
