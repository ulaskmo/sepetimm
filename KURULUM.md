# Kurulum — veritabanı ve yönetim girişi

Site kodu hazır; eksik olan tek şey bir veritabanı. Aşağıdaki adımlar
yaklaşık 10 dakika sürer ve hepsi ücretsiz.

## 1. Veritabanı — Neon (ücretsiz)

Ürünler, rezervasyonlar, kurslar ve müşteri hesapları Postgres'te tutuluyor.
Ayrı bir "hesap veritabanı" gerekmiyor; hepsi aynı veritabanında.

1. [neon.tech](https://neon.tech) → ücretsiz hesap aç → yeni proje oluştur.
   Bölge olarak **Frankfurt (eu-central-1)** seç; Türkiye'ye en yakın olanı.
2. Projeyi açınca verilen **connection string**'i kopyala. Şuna benzer:
   `postgresql://kullanici:sifre@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Proje klasöründe `.env.local` dosyası oluştur:

```
DATABASE_URL=buraya_neon_adresi
SESSION_SECRET=openssl_ile_uretilen_32_haneli_deger
ADMIN_PASSWORD=kendi_belirledigin_uzun_sifre
```

`SESSION_SECRET` üretmek için:

```bash
openssl rand -hex 32
```

## 2. Tabloları oluştur

```bash
npm run db:setup     # tablolar
npm run db:seed      # örnek içerik (isteğe bağlı)
psql "$DATABASE_URL" -f db/seed-urunler.sql   # Eda'nın 11 ürünü
```

`psql` yüklü değilse Neon panelindeki **SQL Editor** sekmesine dosyaların
içeriğini yapıştırıp çalıştırabilirsin. Aynı işi yapar.

## 3. Yönetim girişi

Ayrı bir yönetici hesabı tablosu yok — tek bir şifre var, o da
`ADMIN_PASSWORD`. Bu bilinçli bir tercih: siteyi yöneten tek kişi olduğu
sürece kullanıcı tablosu, şifre sıfırlama ve e-posta doğrulama kurmanın
bir anlamı yok.

- Giriş: `https://<site>/admin`
- Şifre: `.env.local` içindeki `ADMIN_PASSWORD`
- Oturum 30 gün sürüyor, çerez `httpOnly` ve imzalı.

Şifreyi değiştirmek istersen `ADMIN_PASSWORD` değerini değiştir ve yeniden
dağıt; eski oturumlar anında geçersiz olur.

> Müşteri hesapları ayrı çalışıyor: kurs satın alanlar `users` tablosunda,
> kendi şifreleriyle. Onların yönetim paneline erişimi yok.

## 4. Ürünleri yayına alma

`db/seed-urunler.sql` 11 ürünü **taslak** olarak ekler: fiyat 0 ve
"Sitede görünsün" kapalı. Fiyatı bilmeden yayına almak siteye yanlış fiyat
koymak olurdu.

Her ürün için `/admin` sayfasında:

1. Ürünler listesinde **Düzenle**'ye bas
2. **Fiyat (TL)** alanını doldur
3. Varsa **Ölçüler** yaz (örn. `38 × 24 × 18 cm`)
4. **Sitede görünsün** kutusunu işaretle
5. Kaydet

Kaydettiğin anda ana sayfada ve `/urunler` sayfasında görünür.

## 5. Vercel'e alırken

`.env.local` içindeki değerlerin **aynısını** Vercel panelinde
Settings → Environment Variables altına da ekle. `.env.local` git'e girmez,
bu yüzden sunucuya kendiliğinden gitmez.
