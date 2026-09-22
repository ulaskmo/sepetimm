import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Customers never get a password. They prove an email once via a magic link and
 * we hand back an HMAC-signed cookie — no session table to keep clean.
 */

const COOKIE = "sepetim_oturum";
const MAX_AGE_SEC = 60 * 60 * 24 * 60; // 60 gün

function key(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET en az 32 karakter olmalı. `openssl rand -hex 32` ile üretin.");
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", key()).update(payload).digest("base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function seal(email: string): string {
  const payload = `${Buffer.from(normalizeEmail(email)).toString("base64url")}.${
    Date.now() + MAX_AGE_SEC * 1000
  }`;
  return `${payload}.${sign(payload)}`;
}

function unseal(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(parts[2]);
  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(given, expected)) return null;
  if (Number(parts[1]) < Date.now()) return null;
  return Buffer.from(parts[0], "base64url").toString("utf8");
}

export async function startSession(email: string): Promise<void> {
  (await cookies()).set(COOKIE, seal(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in email, or null. This is the only authorisation check we have. */
export async function currentEmail(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  return c ? unseal(c) : null;
}

/** Admin pages are gated by a single shared password in the environment. */
export async function isAdmin(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = (await cookies()).get("sepetim_admin")?.value;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(sign(`admin:${expected}`));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function adminCookieValue(password: string): string {
  return sign(`admin:${password}`);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
