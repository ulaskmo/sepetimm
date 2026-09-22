import crypto from "node:crypto";

/**
 * Password hashing with scrypt from node's crypto — no dependency needed.
 * Stored format: scrypt$<N>$<saltB64>$<hashB64>, so the cost can be raised
 * later without invalidating existing hashes.
 */

const N = 16384; // CPU/memory cost
const KEYLEN = 64;
const SALT_BYTES = 16;

export const MIN_PASSWORD_LENGTH = 8;

function derive(password: string, salt: Buffer, n: number): Buffer {
  // maxmem must be raised to match N, otherwise scrypt throws above the default.
  return crypto.scryptSync(password.normalize("NFKC"), salt, KEYLEN, {
    N: n,
    r: 8,
    p: 1,
    maxmem: 128 * n * 8 * 2,
  });
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = derive(password, salt, N);
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  if (!Number.isInteger(n) || n < 1024 || n > 1 << 20) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], "base64");
    expected = Buffer.from(parts[3], "base64");
  } catch {
    return false;
  }
  if (expected.length !== KEYLEN) return false;

  const actual = derive(password, salt, n);
  return crypto.timingSafeEqual(actual, expected);
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }
  if (password.length > 200) return "Şifre çok uzun.";
  return null;
}
