import { sql } from "@/lib/db";
import { EMAIL_RE, normalizeEmail, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return Response.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  const rows = (await sql`
    select password_hash from users where lower(email) = ${email} limit 1
  `) as unknown as { password_hash: string }[];

  // Same message whether the address is unknown or the password is wrong, so
  // this endpoint can't be used to find out who has an account.
  // ponytail: scrypt's ~100ms cost is the only brute-force throttle. Add a
  // per-email attempt counter if the site ever gets real traffic.
  const ok = rows[0] ? verifyPassword(password, rows[0].password_hash) : false;
  if (!ok) return Response.json({ error: "E-posta veya şifre hatalı." }, { status: 401 });

  await startSession(email);
  return Response.json({ ok: true });
}
