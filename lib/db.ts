import { neon } from "@neondatabase/serverless";

/**
 * Tagged-template SQL. Values are always parameterised — never string-concat
 * user input into these templates.
 *
 * Built lazily so `next build` and a first `npm run dev` work before a database
 * exists; the failure then surfaces as an empty page, not a crashed build.
 */
let _sql: ReturnType<typeof neon> | null = null;

export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL yok. .env.local dosyasına Neon bağlantı adresini ekleyin.");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql(strings, ...values) as Promise<Record<string, unknown>[]>;
}

export type Product = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price_kurus: number;
  images: string[];
  kind: "unique" | "made_to_order";
  lead_time_days: number | null;
  sold: boolean;
  dimensions: string | null;
  published: boolean;
  sort_order: number;
};

export type Course = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price_kurus: number;
  cover_image: string | null;
  bunny_video_id: string | null;
  duration_sec: number | null;
  level: "baslangic" | "orta" | "ileri";
  published: boolean;
  sort_order: number;
};

export type ReservationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "paid"
  | "expired"
  | "cancelled";

export type Reservation = {
  id: number;
  public_id: string;
  product_id: number;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: ReservationStatus;
  price_kurus: number;
  payment_ref: string | null;
  pay_expires_at: string | null;
};

/** A unique piece that is already sold can't be reserved again. */
export function isAvailable(p: Pick<Product, "kind" | "sold" | "published">): boolean {
  return p.published && (p.kind === "made_to_order" || !p.sold);
}
