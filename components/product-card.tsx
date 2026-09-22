"use client";

import Image from "next/image";
import Link from "next/link";
import { formatTRY } from "@/lib/brand";
import { isAvailable, type Product } from "@/lib/db";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const available = isAvailable(product);
  const cover = product.images[0] ?? "/urunler/cicekli-canta-1.jpg";

  return (
    <article className="group">
      <Link href={`/urunler/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-sand">
          <Image
            src={cover}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
              available ? "" : "opacity-60"
            }`}
          />
          {!available && (
            <span className="absolute left-0 top-0 bg-bark px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-bg">
              Satıldı
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-0.5 sm:mt-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <h3 className="text-[12px] font-medium leading-snug sm:text-[15px]">{product.title}</h3>
          <span className="shrink-0 text-[12px] tabular-nums sm:text-[14px]">{formatTRY(product.price_kurus)}</span>
        </div>

        <p className="mt-1 hidden text-[12px] uppercase tracking-[0.16em] text-bark-soft sm:block">
          {product.kind === "unique"
            ? "Tek parça"
            : product.lead_time_days
              ? `Siparişe özel · ${product.lead_time_days} gün`
              : "Siparişe özel"}
        </p>
      </Link>
    </article>
  );
}
