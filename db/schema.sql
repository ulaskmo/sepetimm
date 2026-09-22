-- Sepetim schema. Run once against your Neon/Postgres database:
--   psql "$DATABASE_URL" -f db/schema.sql
-- Money is stored in kuruş (integer). Never use floats for money.

create table if not exists products (
  id            serial primary key,
  slug          text unique not null,
  title         text not null,
  description   text not null default '',
  price_kurus   integer not null check (price_kurus >= 0),
  images        text[] not null default '{}',
  -- 'unique' = the exact photographed piece, sold once.
  -- 'made_to_order' = a design Eda can re-weave on demand.
  kind          text not null default 'unique' check (kind in ('unique', 'made_to_order')),
  lead_time_days integer,                     -- only meaningful for made_to_order
  sold          boolean not null default false, -- only meaningful for unique
  dimensions    text,
  published     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists reservations (
  id            serial primary key,
  public_id     text unique not null,          -- shown to the customer, unguessable
  product_id    integer not null references products(id) on delete restrict,
  name          text not null,
  email         text not null,
  phone         text,
  note          text,
  -- pending  -> Eda has been pinged on Telegram, nobody has paid anything
  -- accepted -> payment link emailed, waiting for payment
  -- paid     -> Shopier confirmed the payment
  -- declined / expired / cancelled -> dead
  status        text not null default 'pending'
                check (status in ('pending','accepted','declined','paid','expired','cancelled')),
  price_kurus   integer not null,              -- frozen at request time
  payment_ref   text,
  pay_expires_at timestamptz,
  decided_at    timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists reservations_status_idx on reservations(status);
create index if not exists reservations_email_idx on reservations(email);

create table if not exists courses (
  id             serial primary key,
  slug           text unique not null,
  title          text not null,
  description    text not null default '',
  price_kurus    integer not null check (price_kurus >= 0),
  cover_image    text,
  bunny_video_id text,                         -- Bunny Stream GUID
  duration_sec   integer,
  level          text not null default 'baslangic'
                 check (level in ('baslangic','orta','ileri')),
  published      boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists course_orders (
  id           serial primary key,
  public_id    text unique not null,
  course_id    integer not null references courses(id) on delete restrict,
  email        text not null,
  name         text,
  status       text not null default 'pending'
               check (status in ('pending','paid','failed','refunded')),
  price_kurus  integer not null,
  payment_ref  text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- One buyer cannot own the same course twice.
create unique index if not exists course_orders_paid_unique
  on course_orders(course_id, lower(email)) where status = 'paid';
create index if not exists course_orders_email_idx on course_orders(lower(email));

-- Single-use magic-link tokens. Sessions themselves are HMAC-signed cookies,
-- so they need no table.
create table if not exists login_tokens (
  token      text primary key,
  email      text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_tokens_expires_idx on login_tokens(expires_at);
