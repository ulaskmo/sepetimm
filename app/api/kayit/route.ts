import { sql } from "@/lib/db";
import { EMAIL_RE, normalizeEmail, startSession } from "@/lib/auth";
import { hashPassword, passwordProblem } from "@/lib/password";

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Geçersiz istek.");
  }

  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  if (name.length < 2 || name.length > 120) return bad("Lütfen adınızı yazın.");
  if (!EMAIL_RE.test(email) || email.length > 160) return bad("Geçerli bir e-posta adresi yazın.");

  const problem = passwordProblem(password);
  if (problem) return bad(problem);

  const existing = await sql`select 1 from users where lower(email) = ${email} limit 1`;
  if (existing.length > 0) {
    return bad("Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.", 409);
  }

  await sql`
    insert into users (email, password_hash, name)
    values (${email}, ${hashPassword(password)}, ${name})
  `;

  await startSession(email);
  return Response.json({ ok: true });
}
