import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  if (derivedKey.length !== keyBuffer.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}

/**
 * A syntactically valid but unusable hash (random salt, random key) used to
 * make the "no such user" login path do the same scrypt work as the "wrong
 * password" path, so response timing can't be used to enumerate accounts.
 */
export const DUMMY_PASSWORD_HASH = `${randomBytes(16).toString("hex")}:${randomBytes(KEY_LENGTH).toString("hex")}`;
