import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/lib/queries";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Sepetler",
  description:
    "Tek tek elde örülen sepetler ve çantaların tamamı. Tek parça ve siparişe özel modeller.",
};

export default async function ProductsPage() {
  const products = await listProducts();
  const available = products.filter((p) => p.kind === "made_to_order" || !p.sold).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Koleksiyon</p>
        <h1 className="mt-4 max-w-2xl font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05]">
          Sepetler ve çantalar
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-bark-soft">
          {products.length > 0
            ? `${products.length} model, ${available} tanesi şu an müsait. Beğendiğiniz sepet için talep gönderin — onay çıkmadan ödeme alınmaz.`
            : "Koleksiyon yakında burada olacak."}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="mt-14 grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {products.map((p, i) => (
            <div key={p.id}>
              <ProductCard product={p} priority={i < 3} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-14 rounded-none border border-dashed border-hair bg-raised/60 p-12 text-center">
          <p className="font-display text-xl font-semibold">Henüz ürün eklenmedi</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bark-soft">
            Yeni sepetler eklendiğinde ilk siz görün:{" "}
            <a className="font-semibold text-rattan-deep" href={BRAND.instagram}>
              @{BRAND.handle}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
