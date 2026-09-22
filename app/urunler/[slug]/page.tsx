import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/reservation-form";
import { getProduct } from "@/lib/queries";
import { isAvailable } from "@/lib/db";
import { formatTRY } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/urunler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Sepet bulunamadı" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/urunler/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const available = isAvailable(product);
  const images = product.images.length > 0 ? product.images : ["/urunler/hasir-oval-sepet.jpg"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20">
      <Link href="/urunler" className="text-sm text-bark-soft hover:text-rattan-deep">
        ← Tüm sepetler
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="space-y-4">
          {images.map((src, i) => (
            <div
              key={src}
              className="relative aspect-4/5 overflow-hidden rounded-none bg-sand shadow-[var(--shadow)]"
            >
              <Image
                src={src}
                alt={`${product.title} — fotoğraf ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="md:sticky md:top-28 md:self-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-sand px-3 py-1 text-[11px] font-medium uppercase tracking-wider">
                {product.kind === "unique" ? "Tek parça" : "Siparişe özel"}
              </span>
              {!available && (
                <span className="rounded-sm bg-bark px-3 py-1 text-[11px] font-semibold text-bg">
                  Satıldı
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.08]">
              {product.title}
            </h1>

            <p className="mt-4 text-2xl font-semibold">{formatTRY(product.price_kurus)}</p>

            {product.description && (
              <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-bark-soft">
                {product.description}
              </p>
            )}

            <dl className="mt-8 grid gap-px overflow-hidden rounded-sm border border-hair bg-line text-sm">
              {product.dimensions && (
                <Row label="Ölçüler" value={product.dimensions} />
              )}
              <Row
                label="Üretim"
                value={
                  product.kind === "unique"
                    ? "Fotoğraftaki sepetin kendisi"
                    : `Sipariş üzerine örülür${
                        product.lead_time_days ? ` · yaklaşık ${product.lead_time_days} gün` : ""
                      }`
                }
              />
              <Row label="Malzeme" value="Geri dönüşümlü kağıt çubuk, keten astar, pamuk dantel" />
            </dl>
          </div>

          <div className="mt-10">
            {available ? (
              <ReservationForm
                productSlug={product.slug}
                productTitle={product.title}
                priceKurus={product.price_kurus}
              />
            ) : (
              <div className="rounded-none border border-hair bg-sand/50 p-7 text-center">
                <p className="font-display text-lg font-semibold">Bu sepet satıldı</p>
                <p className="mt-2 text-sm text-bark-soft">
                  Benzerini siparişe özel ördürmek için Instagram&apos;dan yazabilirsiniz.
                </p>
                <Link
                  href="/urunler"
                  className="mt-5 inline-flex rounded-sm border border-hair px-6 py-3 text-sm font-semibold hover:bg-raised"
                >
                  Müsait sepetlere bak
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 bg-raised px-5 py-4">
      <dt className="w-28 shrink-0 text-bark-soft">{label}</dt>
      <dd className="flex-1 font-medium">{value}</dd>
    </div>
  );
}
