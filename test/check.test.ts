import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

process.env.SHOPIER_API_KEY = "test-key";
process.env.SHOPIER_API_SECRET = "test-secret";
process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

const { buildPayForm, verifyCallback, orderId, PRODUCT_TYPE } = await import("../lib/shopier.ts");
const { isAvailable } = await import("../lib/db.ts");
const { formatTRY } = await import("../lib/brand.ts");
const { slugify, publicId } = await import("../lib/ids.ts");

const SECRET = "test-secret";

test("ödeme formu Shopier'in beklediği imzayı üretir", () => {
  const form = buildPayForm({
    orderId: "R-abc123",
    productName: "Oval sepet",
    productType: PRODUCT_TYPE.physical,
    priceKurus: 145000,
    buyer: { name: "Eda", surname: "Y", email: "a@b.com" },
  });

  assert.equal(form.fields.total_order_value, "1450.00");
  assert.equal(form.fields.currency, "0");
  assert.equal(form.fields.callback, "https://example.com/api/shopier/callback");

  // Same inputs, same order as the official SDK's getDataToBeHashed().
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(
      form.fields.random_nr +
        form.fields.platform_order_id +
        form.fields.total_order_value +
        form.fields.currency
    )
    .digest("base64");
  assert.equal(form.fields.signature, expected);
});

test("geçerli geri dönüş kabul edilir", () => {
  const params = new URLSearchParams({
    platform_order_id: "R-abc123",
    status: "success",
    installment: "0",
    payment_id: "9876",
    random_nr: "123456",
  });
  params.set(
    "signature",
    crypto.createHmac("sha256", SECRET).update("123456R-abc123").digest("base64")
  );

  const result = verifyCallback(params);
  assert.ok(result);
  assert.equal(result.ok, true);
  assert.equal(result.orderId, "R-abc123");
  assert.equal(result.paymentId, "9876");
});

test("sahte imza reddedilir — ödeme asla onaylanmaz", () => {
  const params = new URLSearchParams({
    platform_order_id: "R-abc123",
    status: "success",
    installment: "0",
    payment_id: "9876",
    random_nr: "123456",
    signature: Buffer.from("x".repeat(32)).toString("base64"),
  });
  assert.equal(verifyCallback(params), null);
});

test("sipariş numarası başka bir siparişe kaydırılamaz", () => {
  // Signature covers the order id, so swapping it invalidates the callback.
  const params = new URLSearchParams({
    platform_order_id: "R-baskasi",
    status: "success",
    installment: "0",
    payment_id: "9876",
    random_nr: "123456",
  });
  params.set(
    "signature",
    crypto.createHmac("sha256", SECRET).update("123456R-abc123").digest("base64")
  );
  assert.equal(verifyCallback(params), null);
});

test("eksik alanlı geri dönüş reddedilir", () => {
  assert.equal(verifyCallback(new URLSearchParams({ status: "success" })), null);
});

test("sipariş numarası tipi ayırt edilir", () => {
  assert.deepEqual(orderId.parse(orderId.forReservation("xy9")), {
    kind: "reservation",
    publicId: "xy9",
  });
  assert.deepEqual(orderId.parse(orderId.forCourse("xy9")), { kind: "course", publicId: "xy9" });
  assert.deepEqual(orderId.parse(orderId.forCustom("xy9")), { kind: "custom", publicId: "xy9" });
  assert.equal(orderId.parse("bozuk"), null);
  assert.equal(orderId.parse("X-xy9"), null);
});

test("satılmış tek parça tekrar rezerve edilemez", () => {
  assert.equal(isAvailable({ kind: "unique", sold: false, published: true }), true);
  assert.equal(isAvailable({ kind: "unique", sold: true, published: true }), false);
  // Made-to-order can always be re-woven, sold or not.
  assert.equal(isAvailable({ kind: "made_to_order", sold: true, published: true }), true);
  assert.equal(isAvailable({ kind: "made_to_order", sold: false, published: false }), false);
});

test("fiyatlar kuruştan doğru biçimlenir", () => {
  assert.match(formatTRY(145000), /1\.450/);
  assert.match(formatTRY(9950), /99,50/);
});

test("türkçe başlıklar okunur slug'a çevrilir", () => {
  assert.equal(slugify("Oval Hasır Sepet — Şık ve Güçlü"), "oval-hasir-sepet-sik-ve-guclu");
  assert.equal(slugify("ÇİÇEKLİ SEPET"), "cicekli-sepet");
});

test("public id tahmin edilebilir değil", () => {
  const ids = new Set(Array.from({ length: 500 }, () => publicId()));
  assert.equal(ids.size, 500);
  assert.match(publicId(), /^[23456789abcdefghjkmnpqrstuvwxyz]{12}$/);
});

const { parsePriceToKurus } = await import("../lib/money.ts");
const { hashPassword, verifyPassword, passwordProblem } = await import("../lib/password.ts");

test("Telegram'a yazılan fiyat doğru okunur", () => {
  assert.equal(parsePriceToKurus("1850"), 185000);
  assert.equal(parsePriceToKurus("1.850"), 185000); // Türkçe binlik ayracı
  assert.equal(parsePriceToKurus("1.850,50"), 185050);
  assert.equal(parsePriceToKurus("1850,50"), 185050);
  assert.equal(parsePriceToKurus("1850.50"), 185050);
  assert.equal(parsePriceToKurus(" 1850 TL "), 185000);
  assert.equal(parsePriceToKurus("1850₺"), 185000);
});

test("anlaşılmayan fiyat tahmin edilmez, reddedilir", () => {
  // Guessing here would mean charging the wrong amount.
  for (const bad of ["", "bin sekiz yüz", "1850 lira civarı", "-50", "0", "1,2,3", "abc", "1.85.0"]) {
    assert.equal(parsePriceToKurus(bad), null, `"${bad}" reddedilmeliydi`);
  }
});

test("şifreler scrypt ile saklanır ve doğrulanır", () => {
  const stored = hashPassword("cok-gizli-sifre");
  assert.match(stored, /^scrypt\$\d+\$/);
  assert.ok(!stored.includes("cok-gizli-sifre"));
  assert.equal(verifyPassword("cok-gizli-sifre", stored), true);
  assert.equal(verifyPassword("yanlis-sifre", stored), false);
  // Aynı şifre her seferinde farklı hash üretmeli (rastgele tuz).
  assert.notEqual(hashPassword("ayni"), hashPassword("ayni"));
});

test("bozuk hash kaydı girişe izin vermez", () => {
  for (const bad of ["", "duz-metin", "scrypt$16384$abc", "bcrypt$1$a$b", "scrypt$1$a$b"]) {
    assert.equal(verifyPassword("herhangi", bad), false);
  }
});

test("kısa şifre reddedilir", () => {
  assert.ok(passwordProblem("1234567"));
  assert.equal(passwordProblem("12345678"), null);
});
