import nodemailer from "nodemailer";
import { BRAND, siteUrl, formatTRY } from "./brand";

/**
 * Gmail SMTP for now — it sends to anybody and needs no domain, which is what
 * we have today. Swap the transport for Resend once a real domain exists;
 * nothing outside this file knows the difference.
 *
 * Setup: Google hesabında 2FA aç → "Uygulama şifreleri" → 16 haneli şifreyi
 * SMTP_PASS olarak .env.local'e koy.
 */

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass },
  });
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const t = transport();
  if (!t) {
    console.warn(`[mail] "${subject}" -> ${to} atlandı — SMTP_USER/SMTP_PASS yok`);
    return;
  }
  try {
    await t.sendMail({
      from: `"${BRAND.name}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: shell(html),
    });
  } catch (err) {
    // A failed email must never lose the order — log it and let the caller finish.
    console.error(`[mail] gönderilemedi: ${subject} -> ${to}`, err);
  }
}

function shell(inner: string): string {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#fbf7f1;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#4a3a2c">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e3d5c3;border-radius:20px;padding:32px">
<p style="margin:0 0 24px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a97b4d">${BRAND.name}</p>
${inner}
<hr style="border:none;border-top:1px solid #e3d5c3;margin:32px 0 16px">
<p style="margin:0;font-size:12px;color:#6b5947">${BRAND.name} · ${BRAND.city} · <a href="${BRAND.instagram}" style="color:#a97b4d">@${BRAND.handle}</a></p>
</div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${href}" style="display:inline-block;background:#4a3a2c;color:#fbf7f1;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">${label}</a></p>`;

export function mailReservationReceived(to: string, name: string, product: string) {
  return send(
    to,
    `Talebiniz bize ulaştı — ${product}`,
    `<h1 style="margin:0 0 16px;font-size:22px">Merhaba ${name},</h1>
     <p style="margin:0 0 16px;line-height:1.6"><strong>${product}</strong> için rezervasyon talebiniz bize ulaştı.</p>
     <p style="margin:0 0 16px;line-height:1.6">Eda talebinizi en kısa sürede değerlendirecek. <strong>Şu an herhangi bir ödeme yapmanız gerekmiyor</strong> — talebiniz onaylanırsa ödeme bağlantısını size e-posta ile göndereceğiz.</p>`
  );
}

export function mailReservationAccepted(
  to: string,
  name: string,
  product: string,
  priceKurus: number,
  publicId: string
) {
  return send(
    to,
    `Talebiniz onaylandı — ${product}`,
    `<h1 style="margin:0 0 16px;font-size:22px">Harika haber ${name}!</h1>
     <p style="margin:0 0 16px;line-height:1.6"><strong>${product}</strong> için talebiniz onaylandı ve sizin adınıza ayrıldı.</p>
     <p style="margin:0 0 4px;line-height:1.6">Tutar: <strong>${formatTRY(priceKurus)}</strong></p>
     <p style="margin:0;line-height:1.6;color:#6b5947;font-size:14px">Ödemenizi aşağıdaki güvenli bağlantıdan tamamlayabilirsiniz. Bağlantı 3 gün geçerlidir.</p>
     ${btn(`${siteUrl()}/odeme/${publicId}`, "Ödemeyi tamamla")}`
  );
}

export function mailReservationDeclined(to: string, name: string, product: string) {
  return send(
    to,
    `Talebiniz hakkında — ${product}`,
    `<h1 style="margin:0 0 16px;font-size:22px">Merhaba ${name},</h1>
     <p style="margin:0 0 16px;line-height:1.6">Maalesef <strong>${product}</strong> için talebinizi bu sefer karşılayamıyoruz.</p>
     <p style="margin:0 0 16px;line-height:1.6">Hiçbir ödeme alınmadı. Diğer sepetlere göz atmak isterseniz sizi bekliyoruz.</p>
     ${btn(`${siteUrl()}/urunler`, "Diğer sepetlere bak")}`
  );
}

export function mailReservationPaid(to: string, name: string, product: string, priceKurus: number) {
  return send(
    to,
    `Ödemeniz alındı — ${product}`,
    `<h1 style="margin:0 0 16px;font-size:22px">Teşekkürler ${name}!</h1>
     <p style="margin:0 0 16px;line-height:1.6"><strong>${product}</strong> için ${formatTRY(priceKurus)} tutarındaki ödemeniz alındı.</p>
     <p style="margin:0;line-height:1.6">Eda sepetinizi hazırlamaya başlıyor. Kargoya verildiğinde size tekrar yazacağız.</p>`
  );
}

export function mailCoursePaid(to: string, course: string) {
  return send(
    to,
    `Kursunuz hazır — ${course}`,
    `<h1 style="margin:0 0 16px;font-size:22px">İyi seyirler!</h1>
     <p style="margin:0 0 16px;line-height:1.6"><strong>${course}</strong> kursuna erişiminiz açıldı.</p>
     <p style="margin:0;line-height:1.6;color:#6b5947;font-size:14px">Giriş yapmak için e-posta adresinizi girmeniz yeterli — şifre yok.</p>
     ${btn(`${siteUrl()}/hesabim`, "Kursu izle")}`
  );
}

export function mailLoginLink(to: string, url: string) {
  return send(
    to,
    "Giriş bağlantınız",
    `<h1 style="margin:0 0 16px;font-size:22px">Giriş bağlantınız</h1>
     <p style="margin:0 0 16px;line-height:1.6">Kurslarınıza erişmek için aşağıdaki butona tıklayın. Bağlantı 20 dakika geçerlidir ve tek kullanımlıktır.</p>
     ${btn(url, "Giriş yap")}
     <p style="margin:0;line-height:1.6;color:#6b5947;font-size:13px">Bu girişi siz talep etmediyseniz bu e-postayı yok sayabilirsiniz.</p>`
  );
}
