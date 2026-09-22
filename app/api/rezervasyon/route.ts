import { sql, isAvailable, type Product } from "@/lib/db";
import { publicId } from "@/lib/ids";
import { askApproval, esc } from "@/lib/telegram";
import { mailReservationReceived } from "@/lib/mail";
import { formatTRY, siteUrl } from "@/lib/brand";
import { EMAIL_RE, normalizeEmail } from "@/lib/auth";
import { normalizeTrMobile } from "@/lib/phone";

/** Anti-flood: one email may not sit on more than this many open requests. */
const MAX_OPEN_PER_EMAIL = 5;

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
  // Telefon artık zorunlu: onay mesajı WhatsApp ile gidiyor.
  const phone = normalizeTrMobile(String(body.phone ?? ""));
  const note = String(body.note ?? "").trim() || null;

  if (!slug) return bad("Ürün bulunamadı.");
  if (name.length < 2 || name.length > 120) return bad("Lütfen adınızı yazın.");
  if (!EMAIL_RE.test(email) || email.length > 160) return bad("Geçerli bir e-posta adresi yazın.");
  if (!phone) {
    return bad("Geçerli bir cep telefonu yazın (örn. 0555 111 22 33). Onayı WhatsApp'tan göndereceğiz.");
  }
  if (note && note.length > 600) return bad("Not 600 karakterden kısa olmalı.");

  const products = (await sql`
    select * from products where slug = ${slug} and published = true limit 1
  `) as unknown as Product[];
  const product = products[0];
  if (!product) return bad("Ürün bulunamadı.", 404);
  if (!isAvailable(product)) return bad("Bu sepet artık müsait değil.", 409);

  const open = await sql`
    select count(*)::int as n from reservations
    where lower(email) = ${email} and status in ('pending','accepted')
  `;
  if (Number(open[0]?.n ?? 0) >= MAX_OPEN_PER_EMAIL) {
    return bad("Bekleyen çok fazla talebiniz var. Mevcut talepleriniz sonuçlanınca tekrar deneyin.", 429);
  }

  const id = publicId();
  await sql`
    insert into reservations (public_id, product_id, name, email, phone, note, price_kurus)
    values (${id}, ${product.id}, ${name}, ${email}, ${phone}, ${note}, ${product.price_kurus})
  `;

  // Ping Eda, then confirm to the customer. Neither failure may lose the row.
  await askApproval(
    [
      `🧺 <b>Yeni rezervasyon talebi</b>`,
      ``,
      `<b>${esc(product.title)}</b> — ${formatTRY(product.price_kurus)}`,
      `👤 ${esc(name)}`,
      `✉️ ${esc(email)}`,
      phone ? `📞 ${esc(phone)}` : null,
      note ? `\n📝 ${esc(note)}` : null,
      ``,
      `<a href="${siteUrl()}/urunler/${product.slug}">Ürünü aç</a> · kod: <code>${id}</code>`,
    ]
      .filter(Boolean)
      .join("\n"),
    id
  );

  await mailReservationReceived(email, name, product.title);

  return Response.json({ ok: true, id });
}
