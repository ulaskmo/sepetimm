import crypto from "node:crypto";
import { siteUrl } from "./brand";

/**
 * Shopier "api_pay4" integration.
 *
 * Field names, signature inputs and the callback contract are taken from the
 * SDK that Shopier links to as official (github.com/erkineren/shopier):
 *   request  signature = base64(hmac_sha256(random_nr + platform_order_id + total_order_value + currency, secret))
 *   callback signature = base64(hmac_sha256(random_nr + platform_order_id, secret))
 *
 * Shopier has no redirect-URL API: the browser must POST a form to them, so we
 * render a self-submitting form at /odeme/[id] instead of returning a link.
 */

const PAY_URL = "https://www.shopier.com/ShowProduct/api_pay4.php";

const CURRENCY_TL = 0;
const LANG_TR = 0;
/** 0 = physical goods (baskets), 1 = downloadable/virtual (courses). */
export const PRODUCT_TYPE = { physical: 0, digital: 1 } as const;

function secret(): string {
  const s = process.env.SHOPIER_API_SECRET;
  if (!s) throw new Error("SHOPIER_API_SECRET tanımlı değil.");
  return s;
}

function apiKey(): string {
  const k = process.env.SHOPIER_API_KEY;
  if (!k) throw new Error("SHOPIER_API_KEY tanımlı değil.");
  return k;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data, "utf8").digest("base64");
}

/** Shopier wants a plain decimal string, e.g. "1450.00". */
function toDecimal(kurus: number): string {
  return (kurus / 100).toFixed(2);
}

export type Buyer = {
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
};

export type PayForm = { action: string; fields: Record<string, string> };

/**
 * Build the hidden fields for the Shopier payment form.
 * `orderId` must be unique forever — it is what the callback echoes back.
 */
export function buildPayForm(opts: {
  orderId: string;
  productName: string;
  productType: number;
  priceKurus: number;
  buyer: Buyer;
}): PayForm {
  const randomNr = String(crypto.randomInt(100000, 1000000));
  const total = toDecimal(opts.priceKurus);

  // Shopier validates every address field as non-empty even for digital goods.
  const address = opts.buyer.address?.trim() || "Belirtilmedi";
  const city = opts.buyer.city?.trim() || "Giresun";
  const postcode = opts.buyer.postcode?.trim() || "28000";

  const fields: Record<string, string> = {
    API_key: apiKey(),
    website_index: process.env.SHOPIER_WEBSITE_INDEX || "1",
    platform_order_id: opts.orderId,
    product_name: opts.productName.slice(0, 200),
    product_type: String(opts.productType),
    buyer_name: opts.buyer.name,
    buyer_surname: opts.buyer.surname,
    buyer_email: opts.buyer.email,
    buyer_account_age: "0",
    buyer_id_nr: opts.orderId,
    buyer_phone: opts.buyer.phone?.replace(/\D/g, "") || "5000000000",
    billing_address: address,
    billing_city: city,
    billing_country: "Turkey",
    billing_postcode: postcode,
    shipping_address: address,
    shipping_city: city,
    shipping_country: "Turkey",
    shipping_postcode: postcode,
    total_order_value: total,
    currency: String(CURRENCY_TL),
    platform: "0",
    is_in_frame: "0",
    current_language: String(LANG_TR),
    modul_version: "1.0.4",
    random_nr: randomNr,
    callback: `${siteUrl()}/api/shopier/callback`,
  };

  fields.signature = sign(randomNr + opts.orderId + total + String(CURRENCY_TL));
  return { action: PAY_URL, fields };
}

export type CallbackResult = {
  ok: boolean;
  orderId: string;
  paymentId: string;
  installment: string;
};

/**
 * Verify a Shopier callback POST. Returns null when the signature does not
 * check out — treat that as a forged request and change nothing.
 */
export function verifyCallback(form: URLSearchParams): CallbackResult | null {
  const orderId = form.get("platform_order_id");
  const status = form.get("status");
  const randomNr = form.get("random_nr");
  const signature = form.get("signature");
  if (!orderId || !status || !randomNr || !signature) return null;

  const expected = Buffer.from(sign(randomNr + orderId), "base64");
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return null;
  }
  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(given, expected)) return null;

  return {
    ok: status === "success",
    orderId,
    paymentId: form.get("payment_id") ?? "",
    installment: form.get("installment") ?? "0",
  };
}

/** Order ids carry their own type so one callback endpoint serves every flow. */
const KINDS = { R: "reservation", C: "course", O: "custom" } as const;

export type OrderKind = (typeof KINDS)[keyof typeof KINDS];

export const orderId = {
  forReservation: (publicId: string) => `R-${publicId}`,
  forCourse: (publicId: string) => `C-${publicId}`,
  forCustom: (publicId: string) => `O-${publicId}`,
  parse: (id: string): { kind: OrderKind; publicId: string } | null => {
    const m = /^([RCO])-(.+)$/.exec(id);
    if (!m) return null;
    return { kind: KINDS[m[1] as keyof typeof KINDS], publicId: m[2] };
  },
};
