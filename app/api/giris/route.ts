import crypto from "node:crypto";
import { sql } from "@/lib/db";
import { EMAIL_RE, normalizeEmail } from "@/lib/auth";
import { mailLoginLink } from "@/lib/mail";
import { siteUrl } from "@/lib/brand";

const TTL_MIN = 20;
/** Requests per email per window, so the inbox can't be used as a weapon. */
const MAX_PER_WINDOW = 5;
const WINDOW_MIN = 15;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? ""));
  if (!EMAIL_RE.test(email) || email.length > 160) {
    return Response.json({ error: "Geçerli bir e-posta adresi yazın." }, { status: 400 });
  }

  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const recent = await sql`
    select count(*)::int as n from login_tokens
    where lower(email) = ${email} and created_at > ${since}
  `;
  if (Number(recent[0]?.n ?? 0) >= MAX_PER_WINDOW) {
    return Response.json(
      { error: "Çok fazla giriş denemesi. Birkaç dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  // Only the hash is stored: a leaked database still can't log anyone in.
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + TTL_MIN * 60_000).toISOString();

  await sql`
    insert into login_tokens (token, email, expires_at)
    values (${hash}, ${email}, ${expires})
  `;

  await mailLoginLink(email, `${siteUrl()}/giris/dogrula?token=${token}`);

  // Always the same answer, so this endpoint can't be used to test which
  // addresses have bought something.
  return Response.json({ ok: true });
}
