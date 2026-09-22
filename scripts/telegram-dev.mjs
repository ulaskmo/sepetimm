/**
 * Local Telegram bridge for development.
 *
 * Telegram only delivers updates to a public HTTPS webhook, so the approve /
 * decline buttons cannot reach a machine running on localhost. Rather than
 * deploy just to try them, this polls getUpdates and hands each update to the
 * real webhook route with the correct secret header — so the code under test
 * is exactly the code that will run in production.
 *
 *   npm run telegram:dev
 *
 * Stop it before setting a real webhook: Telegram allows polling or a webhook,
 * never both at once.
 */
import { readFile } from "node:fs/promises";

const env = {};
const text = await readFile(".env.local", "utf8");
for (const line of text.split("\n")) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const token = env.TELEGRAM_BOT_TOKEN;
const secret = env.TELEGRAM_WEBHOOK_SECRET;
const target = process.env.TARGET || "http://localhost:3000/api/telegram/webhook";

if (!token || !secret) {
  console.error("TELEGRAM_BOT_TOKEN veya TELEGRAM_WEBHOOK_SECRET eksik.");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

// Polling and a webhook are mutually exclusive.
await api("deleteWebhook", { drop_pending_updates: false });
const me = await api("getMe");
console.log(`köprü çalışıyor — @${me.result.username} → ${target}`);
console.log("Telegram'daki butonlara basın; burada göreceksiniz. Durdurmak için Ctrl+C.\n");

let offset = 0;
for (;;) {
  let res;
  try {
    res = await api("getUpdates", { offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
  } catch (err) {
    console.error("getUpdates hatası:", err.message);
    await new Promise((r) => setTimeout(r, 2000));
    continue;
  }
  if (!res.ok) {
    console.error("getUpdates:", res.description);
    await new Promise((r) => setTimeout(r, 2000));
    continue;
  }

  for (const update of res.result) {
    offset = update.update_id + 1;
    const kind = update.callback_query
      ? `buton: ${update.callback_query.data}`
      : `mesaj: ${update.message?.text ?? "(metin yok)"}`;
    process.stdout.write(`→ ${kind} … `);
    try {
      const r = await fetch(target, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-telegram-bot-api-secret-token": secret,
        },
        body: JSON.stringify(update),
      });
      console.log(`${r.status} ${r.ok ? "tamam" : await r.text()}`);
    } catch (err) {
      console.log(`iletilemedi: ${err.message}`);
    }
  }
}
