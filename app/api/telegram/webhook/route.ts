import { sql, type Product, type Reservation } from "@/lib/db";
import { answerCallback, esc, notify, settleMessage } from "@/lib/telegram";
import { mailReservationAccepted, mailReservationDeclined } from "@/lib/mail";
import { formatTRY, siteUrl } from "@/lib/brand";

/** How long an approved customer has to pay before the piece is released. */
const PAY_WINDOW_DAYS = 3;

type CallbackQuery = {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number } };
  from?: { id: number; first_name?: string };
};

type Update = {
  callback_query?: CallbackQuery;
  message?: { chat: { id: number }; text?: string };
};

export async function POST(request: Request) {
  // Telegram echoes this header back on every call; without it the request is
  // from someone who guessed the URL, so we answer 401 and touch nothing.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || request.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const update = (await request.json()) as Update;

  // Convenience during setup: the bot tells Eda her own chat id.
  if (update.message?.text) {
    await notify(
      `Bu sohbetin kimliği: <code>${update.message.chat.id}</code>\n` +
        `Bu numarayı TELEGRAM_CHAT_ID olarak kaydedin.`
    );
    return Response.json({ ok: true });
  }

  const cq = update.callback_query;
  if (!cq?.data || !cq.message) return Response.json({ ok: true });

  // Only the configured chat may decide. Anyone else pressing a forwarded
  // button changes nothing.
  if (String(cq.message.chat.id) !== String(process.env.TELEGRAM_CHAT_ID)) {
    await answerCallback(cq.id, "Bu işlem için yetkiniz yok.");
    return Response.json({ ok: true });
  }

  const [action, publicId] = cq.data.split(":");
  if ((action !== "ok" && action !== "no") || !publicId) return Response.json({ ok: true });

  const rows = (await sql`
    select r.*, p.title as product_title, p.slug as product_slug, p.kind as product_kind
    from reservations r join products p on p.id = r.product_id
    where r.public_id = ${publicId} limit 1
  `) as unknown as (Reservation & {
    product_title: string;
    product_slug: string;
    product_kind: Product["kind"];
  })[];
  const res = rows[0];

  if (!res) {
    await answerCallback(cq.id, "Talep bulunamadı.");
    return Response.json({ ok: true });
  }

  // Decisions are one-way. A second press on an old message is a no-op.
  if (res.status !== "pending") {
    await answerCallback(cq.id, `Bu talep zaten "${res.status}" durumunda.`);
    return Response.json({ ok: true });
  }

  const accepted = action === "ok";
  const newStatus = accepted ? "accepted" : "declined";
  // Computed here, not as SQL text: an interpolated `interval` string would be
  // sent as a bind parameter and fail to cast.
  const payExpiresAt = accepted
    ? new Date(Date.now() + PAY_WINDOW_DAYS * 86_400_000).toISOString()
    : null;

  const updated = await sql`
    update reservations
    set status = ${newStatus},
        decided_at = now(),
        pay_expires_at = ${payExpiresAt}
    where public_id = ${publicId} and status = 'pending'
    returning id
  `;
  // Lost the race to another press — the other one already did the work.
  if (updated.length === 0) {
    await answerCallback(cq.id, "Bu talep az önce işlendi.");
    return Response.json({ ok: true });
  }

  if (accepted) {
    await mailReservationAccepted(
      res.email,
      res.name,
      res.product_title,
      res.price_kurus,
      res.public_id
    );
  } else {
    await mailReservationDeclined(res.email, res.name, res.product_title);
  }

  await settleMessage(
    cq.message.chat.id,
    cq.message.message_id,
    [
      accepted ? "✅ <b>Onaylandı</b>" : "❌ <b>Reddedildi</b>",
      ``,
      `<b>${esc(res.product_title)}</b> — ${formatTRY(res.price_kurus)}`,
      `👤 ${esc(res.name)} · ${esc(res.email)}`,
      ``,
      accepted
        ? `Ödeme bağlantısı e-postayla gönderildi (${PAY_WINDOW_DAYS} gün geçerli).\n<a href="${siteUrl()}/odeme/${res.public_id}">Ödeme sayfası</a>`
        : `Müşteriye bilgi verildi. Hiçbir ödeme alınmadı.`,
    ].join("\n")
  );

  await answerCallback(cq.id, accepted ? "Onaylandı, e-posta gitti." : "Reddedildi, e-posta gitti.");
  return Response.json({ ok: true });
}
