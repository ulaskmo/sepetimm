import { defineConfig } from "@neon/config/v1";

/**
 * Buckets as code, so a new branch gets the same storage layout.
 *
 * Two buckets on purpose: product photos sit on a public shop page and must be
 * cacheable by the CDN, while customer reference photos on custom orders must
 * never be fetchable by guessing a URL. One bucket cannot be both.
 */
export default defineConfig({
  buckets: {
    // Müşterilerin özel sipariş formunda yüklediği görseller.
    sepetimbucket: { access: "private" },
    // Ürün fotoğrafları — mağaza sayfasında herkese açık.
    "sepetim-urun": { access: "public_read" },
  },
});
