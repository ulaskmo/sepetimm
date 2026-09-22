# Sepetim

Geri dönüşümlü kağıt çubuklarla elde örülen sepetlerin tanıtıldığı, rezervasyon
talebi alınan ve video kurs satılan Türkçe site.

- **Ürünler** — tek parça ya da siparişe özel sepetler
- **Rezervasyon** — müşteri talep gönderir → Telegram'dan onaylarsınız → ödeme
  bağlantısı e-postayla gider. **Onay çıkmadan kimseden ödeme alınmaz.**
- **Kurslar** — 5–10 dakikalık video dersler, ödeme sonrası şifresiz e-posta girişiyle izlenir
- **Yönetim** — `/admin` üzerinden ürün ve kurs ekleme

Next.js 16 · Tailwind 4 · Postgres (Neon) · Shopier · Telegram · Bunny Stream

---

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local     # doldurun (aşağıdaki adımlar)
npm run db:setup               # tabloları oluşturur
npm run db:seed                # örnek ürün ve kurslar (isteğe bağlı)
npm run dev
```

`npm test` ödeme imzası ve stok kurallarını doğrular. Ödemeye dokunan bir
değişiklikten sonra mutlaka çalıştırın.

---

## Kurulum adımları

Sırayla gidin. Her adım `.env.local` içine bir şey yazdırır.

### 1. Veritabanı — Neon (ücretsiz)

1. [neon.tech](https://neon.tech) üzerinde ücretsiz hesap açın, yeni bir proje oluşturun.
2. Bağlantı adresini (`postgresql://...`) kopyalayıp `DATABASE_URL` olarak yapıştırın.
3. `npm run db:setup` çalıştırın.

### 2. Gizli anahtarlar

```bash
openssl rand -hex 32      # çıktıyı SESSION_SECRET'e yazın
openssl rand -hex 16      # çıktıyı TELEGRAM_WEBHOOK_SECRET'e yazın
```

`ADMIN_PASSWORD` olarak kendinize uzun bir şifre belirleyin — `/admin` sayfasına
bununla gireceksiniz.

### 3. E-posta — Gmail

Henüz alan adı olmadığı için e-postalar Gmail üzerinden gidiyor.

1. Google hesabınızda **2 adımlı doğrulamayı** açın.
2. [Uygulama şifreleri](https://myaccount.google.com/apppasswords) sayfasından
   yeni bir şifre üretin (16 hane).
3. `SMTP_USER` = Gmail adresiniz, `SMTP_PASS` = bu 16 haneli şifre.
   Normal Gmail şifreniz **çalışmaz**.

Günlük 500 e-posta sınırı var; bu ölçek için fazlasıyla yeterli.

### 4. Telegram botu

1. Telegram'da [@BotFather](https://t.me/BotFather) ile konuşun → `/newbot`.
2. Verdiği token'ı `TELEGRAM_BOT_TOKEN` olarak kaydedin.
3. Site yayına çıktıktan sonra webhook'u bağlayın:

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<SITE>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

4. Botunuza herhangi bir mesaj yazın — size sohbet kimliğinizi geri yazacak.
   O numarayı `TELEGRAM_CHAT_ID` olarak kaydedin ve yeniden dağıtın.

Bundan sonra her rezervasyon talebi **Onayla / Reddet** butonlarıyla size düşer.

### 5. Ödeme — Shopier

Şirket kurmadan satış yapabildiğiniz için Shopier seçildi (iyzico ve PayTR
vergi levhası ister).

1. [shopier.com](https://www.shopier.com) üzerinde satıcı hesabı açın.
2. Panelden **API Entegrasyonu** bölümüne girin.
3. `SHOPIER_API_KEY` ve `SHOPIER_API_SECRET` değerlerini kopyalayın.
4. Geri dönüş adresi olarak `https://<SITE>/api/shopier/callback` tanımlayın.

> Ödeme sayfası kart bilgisi toplamaz; müşteri Shopier'e yönlendirilir. Ödemenin
> gerçekten alındığı, Shopier'in imzalı geri dönüşüyle doğrulanır — imza
> tutmazsa sipariş **ödendi sayılmaz**.

### 6. Video — Bunny Stream

1. [bunny.net](https://bunny.net) → **Stream** → yeni kütüphane oluşturun.
2. Kütüphane kimliğini `BUNNY_LIBRARY_ID` olarak kaydedin.
3. **Security** sekmesinde *Token Authentication*'ı **açın** ve anahtarı
   `BUNNY_TOKEN_KEY` olarak kaydedin. Açmazsanız video bağlantıları paylaşılabilir hale gelir.
4. Videoyu yükleyin, GUID'ini kopyalayıp `/admin` → kurs formundaki
   **Bunny video kimliği** alanına yapıştırın.

### 7. Yayına alma — Vercel

```bash
npx vercel            # ilk kurulum
npx vercel --prod     # yayına al
```

`.env.local` içindeki tüm değişkenleri Vercel panelinden **Environment
Variables** bölümüne de ekleyin. Alan adı alınca `NEXT_PUBLIC_SITE_URL` ekleyip
Gmail yerine kendi alan adınızla e-posta göndermeye geçebilirsiniz.

---

## Günlük kullanım

| Yapmak istediğiniz | Nereden |
| --- | --- |
| Ürün eklemek / fiyat değiştirmek | `/admin` |
| Talebi onaylamak / reddetmek | Telegram |
| Satılan sepeti listeden çıkarmak | otomatik (tek parça ürünlerde ödeme alınınca) |
| Kurs eklemek | `/admin`, Bunny video kimliğiyle |
| Talep geçmişini görmek | `/admin` |

---

## Bilinmesi gerekenler

- **Para kuruş cinsinden saklanır** (`price_kurus`). 1.450 TL = `145000`.
  Hiçbir yerde ondalık sayı kullanmayın.
- **Onay tek yönlüdür.** Bir talep onaylandıktan sonra Telegram'daki butonlara
  tekrar basmak bir şey değiştirmez.
- **Ödeme bağlantısı 3 gün geçerlidir.** Süre `app/api/telegram/webhook/route.ts`
  içindeki `PAY_WINDOW_DAYS` ile değişir.
- **Fotoğraflar şimdilik adres olarak giriliyor.** Telefondan doğrudan yükleme
  yok — eklenecek ilk özellik bu (Vercel Blob).
- Süresi dolan rezervasyonlar `expired` durumuna otomatik geçmez; ödeme sayfası
  süreyi kontrol edip reddeder. Otomatik temizlik gerekirse bir cron eklenebilir.
