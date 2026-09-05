import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(passphrase, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassphrase(passphrase: string, encoded: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(passphrase, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseCookieHeader(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").flatMap((entry) => {
      const index = entry.indexOf("=");
      if (index < 1) return [];
      const key = entry.slice(0, index).trim();
      const value = entry.slice(index + 1).trim();
      try {
        return [[key, decodeURIComponent(value)]];
      } catch {
        return [[key, value]];
      }
    }),
  );
}

export function anonymizeVisitor(ip: string, visitorId = ""): string {
  const secret = process.env.SESSION_SECRET ?? "local-development-only-secret";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`${day}:${ip}:${visitorId}`).digest("hex");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function estimateReadingMinutes(source: string): number {
  const words = source
    .replace(/<[^>]+>/g, " ")
    .replace(/[`#>*_[\]()!-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
