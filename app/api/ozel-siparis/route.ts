import { sql } from "@/lib/db";
import { publicId } from "@/lib/ids";
import { askCustomApproval, esc } from "@/lib/telegram";
import { mailCustomReceived } from "@/lib/mail";
import { EMAIL_RE, normalizeEmail } from "@/lib/auth";
import { normalizeTrMobile } from "@/lib/phone";

/** Telegram refuses photos above 10MB; stay under it. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_OPEN_PER_EMAIL = 3;

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

/** Optional measurement: blank is fine, nonsense is not. */
function cm(value: FormDataEntryValue | null, label: string): number | null {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 500) {
    throw new Error(`${label} 0 ile 500 cm arasında olmalı.`);
  }
  return Math.round(n * 10) / 10;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Geçersiz istek.");
  }

  const name = String(form.get("name") ?? "").trim();
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const phone = normalizeTrMobile(String(form.get("phone") ?? ""));
  const description = String(form.get("description") ?? "").trim();
  const color = String(form.get("color") ?? "").trim() || null;

  if (name.length < 2 || name.length > 120) return bad("Lütfen adınızı yazın.");
  if (!EMAIL_RE.test(email) || email.length > 160) return bad("Geçerli bir e-posta adresi yazın.");
  if (description.length < 10 || description.length > 1500) {
    return bad("Nasıl bir sepet istediğinizi biraz anlatın (en az 10 karakter).");
  }
  if (!phone) {
    return bad("Geçerli bir cep telefonu yazın (örn. 0555 111 22 33). Size WhatsApp'tan döneceğiz.");
  }
  if (color && color.length > 80) return bad("Renk tercihi çok uzun.");

  let width: number | null, depth: number | null, height: number | null;
  try {
    width = cm(form.get("width_cm"), "Genişlik");
    depth = cm(form.get("depth_cm"), "Derinlik");
    height = cm(form.get("height_cm"), "Yükseklik");
  } catch (err) {
    return bad((err as Error).message);
  }

  const photo = form.get("photo");
  let photoPart: { blob: Blob; filename: string } | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) return bad("Sadece resim dosyası yükleyebilirsiniz.");
    if (photo.size > MAX_PHOTO_BYTES) return bad("Fotoğraf 8 MB'tan küçük olmalı.");
    photoPart = { blob: photo, filename: photo.name || "ornek.jpg" };
  }

  const open = await sql`
    select count(*)::int as n from custom_requests
    where lower(email) = ${email} and status in ('pending','accepted')
  `;
  if (Number(open[0]?.n ?? 0) >= MAX_OPEN_PER_EMAIL) {
    return bad("Bekleyen çok fazla özel sipariş talebiniz var. Mevcutlar sonuçlanınca tekrar deneyin.", 429);
  }

  const id = publicId();
  await sql`
    insert into custom_requests
      (public_id, name, email, phone, description, width_cm, depth_cm, height_cm, color, has_photo)
    values
      (${id}, ${name}, ${email}, ${phone}, ${description},
       ${width}, ${depth}, ${height}, ${color}, ${Boolean(photoPart)})
  `;

  const size = [width, depth, height].every((v) => v === null)
    ? "Belirtilmedi"
    : `${width ?? "?"} × ${depth ?? "?"} × ${height ?? "?"} cm`;

  const messageId = await askCustomApproval(
    [
      `✏️ <b>Özel sipariş talebi</b>`,
      ``,
      `👤 ${esc(name)}`,
      `✉️ ${esc(email)}`,
      phone ? `📞 ${esc(phone)}` : null,
      `📐 ${esc(size)}`,
      color ? `🎨 ${esc(color)}` : null,
      ``,
      `📝 ${esc(description)}`,
      ``,
      `<b>Kabul etmek için bu mesajı yanıtlayıp sadece fiyatı yazın</b> (örn. 1850).`,
      `Kod: <code>${id}</code>`,
    ]
      .filter(Boolean)
      .join("\n"),
    id,
    photoPart
  );

  // Needed to match Eda's reply back to this request.
  if (messageId !== null) {
    await sql`
      insert into telegram_prompts (message_id, kind, public_id)
      values (${messageId}, 'custom', ${id})
      on conflict (message_id) do update set public_id = excluded.public_id
    `;
  }

  await mailCustomReceived(email, name);

  return Response.json({ ok: true, id });
}
