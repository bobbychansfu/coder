import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const scrypt = promisify(scryptCallback);
const HASH_VERSION = "scrypt-v1";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashLocalPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `${HASH_VERSION}$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyLocalPassword(password: string, storedHash: string): Promise<boolean> {
  const [version, encodedSalt, encodedHash] = storedHash.split("$");
  if (version !== HASH_VERSION || !encodedSalt || !encodedHash) return false;

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const expected = Buffer.from(encodedHash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
