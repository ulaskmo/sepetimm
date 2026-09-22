import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { orderId, verifyCallback } from "@/lib/shopier";
import { mailCoursePaid, mailReservationPaid } from "@/lib/mail";
import { esc, notify } from "@/lib/telegram";
import { formatTRY, siteUrl } from "@/lib/brand";

/**
 * Shopier POSTs here after a payment. Everything downstream of this endpoint
 * gives something away for free, so nothing happens until the HMAC verifies.
 */
export async function POST(request: Request) {
  const form = new URLSearchParams(await request.text());
  const result = verifyCallback(form);

  if (!result) {
    console.error("[shopier] imza doğrulanamadı", Object.fromEntries(form));
    return new Response("invalid signature", { status: 400 });
  }

  const parsed = orderId.parse(result.orderId);
  if (!parsed) return new Response("unknown order", { status: 400 });

  if (!result.ok) {
    console.warn(`[shopier] başarısız ödeme: ${result.orderId}`);
    return Response.redirect(`${siteUrl()}/odeme/sonuc?durum=basarisiz`, 303);
  }

  if (parsed.kind === "reservation") {
    await settleReservation(parsed.publicId, result.paymentId);
  } else {
    await settleCourse(parsed.publicId, result.paymentId);
  }

  return Response.redirect(`${siteUrl()}/odeme/sonuc?durum=basarili`, 303);
}

async function settleReservation(publicId: string, paymentId: string) {
  // `status = 'accepted'` in the WHERE makes this idempotent: a replayed
  // callback updates zero rows and sends no second email.
  const rows = (await sql`
    update reservations
    set status = 'paid', paid_at = now(), payment_ref = ${paymentId}
    where public_id = ${publicId} and status = 'accepted'
    returning id, product_id, name, email, price_kurus
  `) as unknown as {
    id: number;
    product_id: number;
    name: string;
    email: string;
    price_kurus: number;
  }[];

  const res = rows[0];
  if (!res) return;

  // A one-of-a-kind piece leaves the shop the moment it is paid for.
  const products = (await sql`
    update products set sold = true
    where id = ${res.product_id} and kind = 'unique'
    returning title
  `) as unknown as { title: string }[];

  const title =
    products[0]?.title ??
    ((await sql`select title from products where id = ${res.product_id}`)[0]?.title as string) ??
    "Sepet";

  // The piece just left the shop — drop it from the cached listings.
  revalidatePath("/urunler");
  revalidatePath("/");

  await mailReservationPaid(res.email, res.name, title, res.price_kurus);
  await notify(
    `💰 <b>Ödeme alındı</b>\n\n<b>${esc(title)}</b> — ${formatTRY(res.price_kurus)}\n👤 ${esc(res.name)} · ${esc(res.email)}\n\nSepeti hazırlamaya başlayabilirsiniz.`
  );
}

async function settleCourse(publicId: string, paymentId: string) {
  const rows = (await sql`
    update course_orders
    set status = 'paid', paid_at = now(), payment_ref = ${paymentId}
    where public_id = ${publicId} and status = 'pending'
    returning id, course_id, email, price_kurus
  `) as unknown as { id: number; course_id: number; email: string; price_kurus: number }[];

  const order = rows[0];
  if (!order) return;

  const courses = (await sql`
    select title from courses where id = ${order.course_id}
  `) as unknown as { title: string }[];
  const title = courses[0]?.title ?? "Kurs";

  await mailCoursePaid(order.email, title);
  await notify(
    `🎬 <b>Kurs satıldı</b>\n\n<b>${esc(title)}</b> — ${formatTRY(order.price_kurus)}\n✉️ ${esc(order.email)}`
  );
}
