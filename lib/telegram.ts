/**
 * Telegram is Eda's admin surface: every reservation arrives as a message with
 * Onayla / Reddet buttons, and pressing one drives the whole flow.
 */

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

function configured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

type TgResponse = { ok?: boolean; result?: { message_id?: number } };

async function call(method: string, body: unknown): Promise<TgResponse | null> {
  if (!configured()) {
    console.warn(`[telegram] ${method} atlandı — TELEGRAM_BOT_TOKEN/CHAT_ID yok`);
    return null;
  }
  const res = await fetch(API(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as TgResponse;
  if (!res.ok || json.ok === false) {
    console.error(`[telegram] ${method} hatası`, json);
  }
  return json;
}

/**
 * Sends the customer's reference photo straight to Telegram, which is the only
 * place it is ever looked at. That keeps a whole file-storage bucket out of
 * this project — Telegram holds the image.
 */
async function callMultipart(method: string, form: FormData): Promise<TgResponse | null> {
  if (!configured()) {
    console.warn(`[telegram] ${method} atlandı — TELEGRAM_BOT_TOKEN/CHAT_ID yok`);
    return null;
  }
  const res = await fetch(API(method), { method: "POST", body: form });
  const json = (await res.json()) as TgResponse;
  if (!res.ok || json.ok === false) {
    console.error(`[telegram] ${method} hatası`, json);
  }
  return json;
}

/** Telegram rejects captions longer than this. */
const CAPTION_LIMIT = 1024;

/** Telegram's HTML parse mode only needs these three escaped. */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function notify(text: string) {
  return call("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

export function askApproval(text: string, publicId: string) {
  return call("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Onayla", callback_data: `ok:${publicId}` },
          { text: "❌ Reddet", callback_data: `no:${publicId}` },
        ],
      ],
    },
  });
}

/** Replace the buttons with the outcome so a decision can't be pressed twice. */
export function settleMessage(chatId: number, messageId: number, text: string) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

export function answerCallback(callbackQueryId: string, text: string) {
  return call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

/**
 * A custom basket has no price until Eda names one, and inline buttons cannot
 * collect a number. So approval is "reply to this message with the amount",
 * and only declining is a button. The returned message id is stored so the
 * reply can be matched back to the request.
 */
export async function askCustomApproval(
  caption: string,
  publicId: string,
  photo?: { blob: Blob; filename: string }
): Promise<number | null> {
  const keyboard = {
    inline_keyboard: [[{ text: "❌ Reddet", callback_data: `ozelno:${publicId}` }]],
  };
  const text = caption.slice(0, CAPTION_LIMIT);

  const json = photo
    ? await callMultipart(
        "sendPhoto",
        (() => {
          const form = new FormData();
          form.set("chat_id", String(process.env.TELEGRAM_CHAT_ID));
          form.set("photo", photo.blob, photo.filename);
          form.set("caption", text);
          form.set("parse_mode", "HTML");
          form.set("reply_markup", JSON.stringify(keyboard));
          return form;
        })()
      )
    : await call("sendMessage", {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        reply_markup: keyboard,
      });

  return json?.result?.message_id ?? null;
}

/** Clears the buttons on a photo message once the request is settled. */
export function settleCaption(chatId: number, messageId: number, caption: string) {
  return call("editMessageCaption", {
    chat_id: chatId,
    message_id: messageId,
    caption: caption.slice(0, CAPTION_LIMIT),
    parse_mode: "HTML",
  });
}
