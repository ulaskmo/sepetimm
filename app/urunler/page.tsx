import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion-primitives";
import { listProducts } from "@/lib/queries";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Sepetler",
  description:
    "Geri dönüşümlü kağıt çubuklarla elde örülmüş sepetlerin tamamı. Tek parça ve siparişe özel modeller.",
};

export default async function ProductsPage() {
  const products = await listProducts();
  const available = products.filter((p) => p.kind === "made_to_order" || !p.sold).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Koleksiyon</p>
        <h1 className="mt-4 max-w-2xl font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05]">
          Elde örülmüş sepetler
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-bark-soft">
          {products.length > 0
            ? `${products.length} model, ${available} tanesi şu an müsait. Beğendiğiniz sepet için talep gönderin — onay çıkmadan ödeme alınmaz.`
            : "Koleksiyon yakında burada olacak."}
        </p>
      </Reveal>

      {products.length > 0 ? (
        <Stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} priority={i < 3} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="mt-14 rounded-3xl border border-dashed border-line bg-raised/60 p-12 text-center">
          <p className="font-display text-xl font-semibold">Henüz ürün eklenmedi</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bark-soft">
            Yeni sepetler eklendiğinde ilk siz görün:{" "}
            <a className="font-semibold text-rattan-deep" href={BRAND.instagram}>
              @{BRAND.handle}
            </a>
          </p>
        </Reveal>
      )}
    </div>
  );
}
