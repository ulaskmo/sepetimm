-- 002: kurs izleyicileri için hesaplar + özel sipariş talepleri
-- Mevcut bir veritabanında: psql "$DATABASE_URL" -f db/migrations/002_hesaplar_ve_ozel_siparis.sql

-- Kurs satın alanlar artık hesap açıyor: aynı e-postayla geri gelip
-- videoları süresiz tekrar izleyebilsinler.
create table if not exists users (
  id            serial primary key,
  email         text not null,
  password_hash text not null,
  name          text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists users_email_unique on users (lower(email));

-- Ölçüsünü ve örnek fotoğrafını müşterinin verdiği, sıfırdan örülecek sepetler.
-- Fiyat baştan belli değildir: Eda talebi görüp Telegram'dan fiyat yazar.
create table if not exists custom_requests (
  id            serial primary key,
  public_id     text unique not null,
  name          text not null,
  email         text not null,
  phone         text,
  description   text not null,
  width_cm      numeric(6,1),
  depth_cm      numeric(6,1),
  height_cm     numeric(6,1),
  color         text,
  -- Fotoğraf doğrudan Telegram'a gönderilir ve orada durur; ayrı bir
  -- dosya deposu kurmamak için burada sadece gönderilip gönderilmediğini tutuyoruz.
  has_photo     boolean not null default false,
  status        text not null default 'pending'
                check (status in ('pending','accepted','declined','paid','expired','cancelled')),
  -- Eda fiyatı belirleyene kadar null.
  price_kurus   integer check (price_kurus is null or price_kurus >= 0),
  payment_ref   text,
  pay_expires_at timestamptz,
  decided_at    timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists custom_requests_status_idx on custom_requests(status);
create index if not exists custom_requests_email_idx on custom_requests(lower(email));

-- Telegram'da fiyat, bot mesajı yanıtlanarak yazılıyor. Hangi yanıtın hangi
-- talebe ait olduğunu bulmak için mesaj kimliğini saklıyoruz.
create table if not exists telegram_prompts (
  message_id  bigint primary key,
  kind        text not null check (kind in ('custom')),
  public_id   text not null,
  created_at  timestamptz not null default now()
);
