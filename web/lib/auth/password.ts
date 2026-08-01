import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  type ScryptOptions,
} from "crypto";

const KEY_LENGTH = 64;
// Generous fixed ceiling covering both the legacy and current cost
// parameters below (scrypt requires maxmem >= ~128*N*r).
const MAXMEM = 128 * 1024 * 1024;

// Cost parameters for scrypt. Raised from Node's defaults (N=16384, r=8, p=1,
// preserved below as LEGACY_PARAMS) as a real hardening step, but
// deliberately not raised further than this: Cloudflare Workers enforces a
// CPU-time budget per request (the Free plan in particular — see
// wrangler.jsonc's history and web/README.md), and login already runs this
// on every request. N=32768 was verified via a real `cf:preview` timing
// check to stay comfortably inside that budget; the OWASP-max N=131072 was
// not, so it's not used here.
const CURRENT_PARAMS = { N: 32768, r: 8, p: 1 };
const LEGACY_PARAMS = { N: 16384, r: 8, p: 1 };

// util.promisify(scrypt) only resolves to the 3-arg (no-options) overload's
// types, so options wouldn't type-check — wrap the callback form manually.
function scrypt(
  password: string,
  salt: string,
  keylen: number,
  params: { N: number; r: number; p: number },
): Promise<Buffer> {
  const options: ScryptOptions = { ...params, maxmem: MAXMEM };
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Hashes are self-describing ("scrypt:N:r:p:salt:key") so cost parameters
// can be strengthened later without invalidating every existing password —
// verifyPassword reads back whatever parameters a given hash was actually
// created with. A bare "salt:key" (no "scrypt:" prefix) is the older format
// from before parameters were encoded, and is verified against the fixed
// legacy defaults it was actually hashed with.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, CURRENT_PARAMS);
  const { N, r, p } = CURRENT_PARAMS;
  return `scrypt:${N}:${r}:${p}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split(":");

  let salt: string | undefined;
  let key: string | undefined;
  let params: { N: number; r: number; p: number };

  if (parts[0] === "scrypt" && parts.length === 6) {
    const [, nStr, rStr, pStr, s, k] = parts;
    const N = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
    params = { N, r, p };
    salt = s;
    key = k;
  } else if (parts.length === 2) {
    params = LEGACY_PARAMS;
    [salt, key] = parts;
  } else {
    return false;
  }

  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, params);
  if (derivedKey.length !== keyBuffer.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}

/**
 * A syntactically valid but unusable hash (random salt, random key) used to
 * make the "no such user" login path do the same scrypt work as the "wrong
 * password" path, so response timing can't be used to enumerate accounts.
 * Uses the current format/params so its timing matches a real current hash.
 */
const { N: DUMMY_N, r: DUMMY_R, p: DUMMY_P } = CURRENT_PARAMS;
export const DUMMY_PASSWORD_HASH = `scrypt:${DUMMY_N}:${DUMMY_R}:${DUMMY_P}:${randomBytes(16).toString("hex")}:${randomBytes(KEY_LENGTH).toString("hex")}`;

/**
 * Single-use token helpers shared by password reset and email invitations.
 * The raw token is what goes in the emailed link; only its SHA-256 hash is
 * ever stored, so a database read alone can't produce a usable token.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
