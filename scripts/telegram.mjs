/**
 * Telegram bot setup and health check.
 *
 *   node scripts/telegram.mjs                      → sadece kontrol
 *   node scripts/telegram.mjs https://siteniz.com  → webhook'u kur
 *
 * Telegram webhook'u HTTPS ister ve sunucuya kendisi bağlanır; bu yüzden
 * localhost adresi kullanılamaz. Önce siteyi yayına alın ya da bir tünel
 * (ngrok, cloudflared) açın.
 */
import { readFile } from "node:fs/promises";

const env = {};
try {
  const text = await readFile(".env.local", "utf8");
  for (const line of text.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {
  console.error(".env.local okunamadı.");
  process.exit(1);
}

const token = env.TELEGRAM_BOT_TOKEN;
const chatId = env.TELEGRAM_CHAT_ID;
const secret = env.TELEGRAM_WEBHOOK_SECRET;

const fail = (msg) => {
  console.error("✗ " + msg);
  process.exitCode = 1;
};

if (!token) {
  fail("TELEGRAM_BOT_TOKEN boş. @BotFather → /mybots → API Token.");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const me = await api("getMe");
if (!me.ok) {
  fail(`Token geçersiz: ${me.description}`);
  console.error("  @BotFather → /mybots → botu seç → API Token → /revoke ile yenisini al.");
  process.exit(1);
}
console.log(`✓ bot: ${me.result.first_name} (@${me.result.username})`);

if (!chatId) fail("TELEGRAM_CHAT_ID boş.");
if (!secret) fail("TELEGRAM_WEBHOOK_SECRET boş.");

const target = process.argv[2];
if (target) {
  if (!target.startsWith("https://")) {
    fail("Webhook adresi https:// ile başlamalı. Telegram localhost'a bağlanamaz.");
    process.exit(1);
  }
  const url = `${target.replace(/\/$/, "")}/api/telegram/webhook`;
  const set = await api("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  console.log(set.ok ? `✓ webhook kuruldu: ${url}` : `✗ webhook kurulamadı: ${set.description}`);
}

const info = await api("getWebhookInfo");
if (info.ok) {
  const w = info.result;
  console.log(`  webhook: ${w.url || "(kurulu değil)"}`);
  if (w.last_error_message) {
    console.log(`  son hata: ${w.last_error_message} (${new Date(w.last_error_date * 1000).toISOString()})`);
  }
  console.log(`  bekleyen güncelleme: ${w.pending_update_count ?? 0}`);
}

if (chatId) {
  const sent = await api("sendMessage", {
    chat_id: chatId,
    text: "✅ Sepetim bağlantı testi — bu mesajı görüyorsanız bot çalışıyor.",
  });
  console.log(
    sent.ok
      ? "✓ test mesajı gönderildi — Telegram'ı kontrol edin"
      : `✗ mesaj gönderilemedi: ${sent.description} (CHAT_ID yanlış olabilir; bota /start yazın)`
  );
}
