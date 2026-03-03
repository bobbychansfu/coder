import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@/lib/authz";

const DEV_AUTH_VERSION = "dev-auth-v1";

export interface DevSessionPayload {
  v: string;
  computingId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

function toBase64Url(input: Buffer | string): string {
  const raw = Buffer.isBuffer(input) ? input.toString("base64") : Buffer.from(input).toString("base64");
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function signPayload(encodedPayload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(encodedPayload).digest();
  return toBase64Url(signature);
}

export function createDevSessionToken(
  input: Omit<DevSessionPayload, "v" | "iat" | "exp"> & { ttlSeconds: number },
  secret: string,
): { token: string; payload: DevSessionPayload } {
  const now = Math.floor(Date.now() / 1000);
  const payload: DevSessionPayload = {
    v: DEV_AUTH_VERSION,
    computingId: input.computingId,
    email: input.email,
    role: input.role,
    iat: now,
    exp: now + input.ttlSeconds,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return { token: `${encodedPayload}.${signature}`, payload };
}

export function verifyDevSessionToken(token: string, secret: string): DevSessionPayload | null {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(encodedSignature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as DevSessionPayload;
    if (parsed.v !== DEV_AUTH_VERSION) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
