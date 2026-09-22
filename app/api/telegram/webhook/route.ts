import { sql, type Product, type Reservation } from "@/lib/db";
import { answerCallback, esc, notify, settleCaption, settleMessage } from "@/lib/telegram";
import {
  mailCustomAccepted,
  mailCustomDeclined,
  mailReservationAccepted,
  mailReservationDeclined,
} from "@/lib/mail";
import { parsePriceToKurus } from "@/lib/money";
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
  message?: {
    chat: { id: number };
    text?: string;
    message_id: number;
    reply_to_message?: { message_id: number };
  };
};

function fromEda(chatId: number | string): boolean {
  return String(chatId) === String(process.env.TELEGRAM_CHAT_ID);
}

function payWindow(): string {
  return new Date(Date.now() + PAY_WINDOW_DAYS * 86_400_000).toISOString();
}

export async function POST(request: Request) {
  // Telegram echoes this header back on every call; without it the request is
  // from someone who guessed the URL, so we answer 401 and touch nothing.
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || request.headers.get("x-telegram-bot-api-secret-token") !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  const update = (await request.json()) as Update;

  // A reply to a custom-order message is how a price gets set — that is the
  // approval for a basket that has no price until Eda names one.
  if (update.message?.reply_to_message && update.message.text) {
    await handlePriceReply(
      update.message.chat.id,
      update.message.reply_to_message.message_id,
      update.message.text
    );
    return Response.json({ ok: true });
  }

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

  if (action === "ozelno" && publicId) {
    await declineCustom(cq.id, cq.message.chat.id, cq.message.message_id, publicId);
    return Response.json({ ok: true });
  }

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
  const payExpiresAt = accepted ? payWindow() : null;

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

type CustomRow = {
  public_id: string;
  name: string;
  email: string;
  status: string;
  has_photo: boolean;
};

/** Looks up which custom request a replied-to message belongs to. */
async function customForMessage(messageId: number): Promise<CustomRow | null> {
  const prompts = (await sql`
    select public_id from telegram_prompts
    where message_id = ${messageId} and kind = 'custom' limit 1
  `) as unknown as { public_id: string }[];
  if (!prompts[0]) return null;

  const rows = (await sql`
    select public_id, name, email, status, has_photo
    from custom_requests where public_id = ${prompts[0].public_id} limit 1
  `) as unknown as CustomRow[];
  return rows[0] ?? null;
}

/**
 * "Reply with the amount" is the approval for a custom basket. A reply that
 * isn't a readable price is answered with help rather than guessed at.
 */
async function handlePriceReply(chatId: number, repliedTo: number, text: string) {
  if (!fromEda(chatId)) return;

  const req = await customForMessage(repliedTo);
  if (!req) return; // a reply to some other message — not ours to act on

  if (req.status !== "pending") {
    await notify(`Bu talep zaten "${req.status}" durumunda, değişiklik yapılmadı.`);
    return;
  }

  const priceKurus = parsePriceToKurus(text);
  if (priceKurus === null) {
    await notify(
      `Fiyatı anlayamadım: <code>${esc(text.slice(0, 40))}</code>\n` +
        `Sadece rakam yazın — örneğin <b>1850</b> ya da <b>1.850,50</b>.`
    );
    return;
  }

  const updated = await sql`
    update custom_requests
    set status = 'accepted', price_kurus = ${priceKurus},
        decided_at = now(), pay_expires_at = ${payWindow()}
    where public_id = ${req.public_id} and status = 'pending'
    returning id
  `;
  if (updated.length === 0) {
    await notify("Bu talep az önce işlendi.");
    return;
  }

  await mailCustomAccepted(req.email, req.name, priceKurus, req.public_id);

  await notify(
    [
      `✅ <b>Özel sipariş onaylandı</b>`,
      ``,
      `👤 ${esc(req.name)} · ${esc(req.email)}`,
      `💰 ${formatTRY(priceKurus)}`,
      ``,
      `Ödeme bağlantısı e-postayla gönderildi (${PAY_WINDOW_DAYS} gün geçerli).`,
      `<a href="${siteUrl()}/odeme/ozel/${req.public_id}">Ödeme sayfası</a>`,
    ].join("\n")
  );
}

async function declineCustom(
  callbackId: string,
  chatId: number,
  messageId: number,
  publicId: string
) {
  const rows = (await sql`
    select public_id, name, email, status, has_photo
    from custom_requests where public_id = ${publicId} limit 1
  `) as unknown as CustomRow[];
  const req = rows[0];

  if (!req) {
    await answerCallback(callbackId, "Talep bulunamadı.");
    return;
  }
  if (req.status !== "pending") {
    await answerCallback(callbackId, `Bu talep zaten "${req.status}" durumunda.`);
    return;
  }

  const updated = await sql`
    update custom_requests set status = 'declined', decided_at = now()
    where public_id = ${publicId} and status = 'pending'
    returning id
  `;
  if (updated.length === 0) {
    await answerCallback(callbackId, "Bu talep az önce işlendi.");
    return;
  }

  await mailCustomDeclined(req.email, req.name);

  const settled = [
    `❌ <b>Özel sipariş reddedildi</b>`,
    ``,
    `👤 ${esc(req.name)} · ${esc(req.email)}`,
    ``,
    `Müşteriye bilgi verildi. Hiçbir ödeme alınmadı.`,
  ].join("\n");

  // A photo message carries a caption, not text — they need different edits.
  if (req.has_photo) {
    await settleCaption(chatId, messageId, settled);
  } else {
    await settleMessage(chatId, messageId, settled);
  }

  await answerCallback(callbackId, "Reddedildi, e-posta gitti.");
}
