import { sql, type Course } from "@/lib/db";
import { publicId } from "@/lib/ids";
import { EMAIL_RE, normalizeEmail } from "@/lib/auth";

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

  const slug = String(body.slug ?? "").trim();
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(String(body.email ?? ""));

  if (name.length < 2 || name.length > 120) return bad("Lütfen adınızı yazın.");
  if (!EMAIL_RE.test(email) || email.length > 160) return bad("Geçerli bir e-posta adresi yazın.");

  const courses = (await sql`
    select * from courses where slug = ${slug} and published = true limit 1
  `) as unknown as Course[];
  const course = courses[0];
  if (!course) return bad("Kurs bulunamadı.", 404);

  const already = await sql`
    select 1 from course_orders
    where course_id = ${course.id} and lower(email) = ${email} and status = 'paid'
    limit 1
  `;
  if (already.length > 0) {
    return bad("Bu kursu zaten satın almışsınız. Hesabım sayfasından izleyebilirsiniz.", 409);
  }

  // Reuse an unpaid attempt instead of piling up rows every time someone
  // bounces off the payment page.
  const open = (await sql`
    select public_id from course_orders
    where course_id = ${course.id} and lower(email) = ${email} and status = 'pending'
    order by created_at desc limit 1
  `) as unknown as { public_id: string }[];

  if (open[0]) return Response.json({ payPath: `/odeme/kurs/${open[0].public_id}` });

  const id = publicId();
  await sql`
    insert into course_orders (public_id, course_id, email, name, price_kurus)
    values (${id}, ${course.id}, ${email}, ${name}, ${course.price_kurus})
  `;

  return Response.json({ payPath: `/odeme/kurs/${id}` });
}
