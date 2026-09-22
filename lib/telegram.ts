/**
 * Telegram is Eda's admin surface: every reservation arrives as a message with
 * Onayla / Reddet buttons, and pressing one drives the whole flow.
 */

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

function configured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function call(method: string, body: unknown): Promise<unknown> {
  if (!configured()) {
    console.warn(`[telegram] ${method} atlandı — TELEGRAM_BOT_TOKEN/CHAT_ID yok`);
    return null;
  }
  const res = await fetch(API(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || (json as { ok?: boolean }).ok === false) {
    console.error(`[telegram] ${method} hatası`, json);
  }
  return json;
}

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
