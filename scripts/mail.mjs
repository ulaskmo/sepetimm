/**
 * SMTP sağlık kontrolü.
 *
 *   npm run mail                 → bağlantıyı doğrula
 *   npm run mail ali@ornek.com   → o adrese test e-postası gönder
 *
 * Uygulamanın kendi ayarlarını kullanır: aynı host, port ve kimlik bilgileri.
 */
import { readFile } from "node:fs/promises";
import nodemailer from "nodemailer";

const env = {};
const text = await readFile(".env.local", "utf8");
for (const line of text.split("\n")) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}

const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const host = env.SMTP_HOST || "smtp.gmail.com";
const port = Number(env.SMTP_PORT || 465);

if (!user || !pass) {
  console.error("✗ SMTP_USER veya SMTP_PASS boş.");
  console.error("  Gmail → 2 adımlı doğrulama açık olmalı.");
  console.error("  https://myaccount.google.com/apppasswords → 16 haneli şifre.");
  process.exit(1);
}

// Gmail uygulama şifreleri 16 hanedir; boşluklu yapıştırmak çok yaygın.
const clean = pass.replace(/\s/g, "");
if (clean.length !== 16) {
  console.warn(`⚠ SMTP_PASS ${clean.length} karakter — Gmail uygulama şifresi 16 hanedir.`);
  console.warn("  Normal Gmail şifreniz çalışmaz.");
}

const tx = nodemailer.createTransport({ host, port, secure: true, auth: { user, pass: clean } });

try {
  await tx.verify();
  console.log(`✓ SMTP bağlantısı kuruldu — ${user} (${host}:${port})`);
} catch (err) {
  console.error(`✗ Bağlantı kurulamadı: ${err.message}`);
  if (/Invalid login|535/.test(err.message)) {
    console.error("  Şifre reddedildi. Normal şifre değil, uygulama şifresi gerekiyor.");
  }
  process.exit(1);
}

const to = process.argv[2];
if (!to) {
  console.log("  Test göndermek için: npm run mail adres@ornek.com");
  process.exit(0);
}

const info = await tx.sendMail({
  from: `"Sepetim" <${user}>`,
  to,
  subject: "Sepetim — SMTP testi",
  html: `<div style="font-family:system-ui;padding:24px;background:#f4ede2;color:#2f2519">
    <p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#8d6237">Sepetim</p>
    <h1 style="font-size:20px;margin:12px 0">E-posta ayarları çalışıyor</h1>
    <p style="line-height:1.6">Bu mesajı görüyorsanız rezervasyon onayları,
    ödeme bağlantıları ve giriş bağlantıları müşterilere ulaşacak.</p>
  </div>`,
});
console.log(`✓ gönderildi → ${to}`);
console.log(`  mesaj kimliği: ${info.messageId}`);
if (info.rejected?.length) console.log(`  ✗ reddedilen: ${info.rejected.join(", ")}`);
