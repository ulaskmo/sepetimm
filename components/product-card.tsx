"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatTRY } from "@/lib/brand";
import { isAvailable, type Product } from "@/lib/db";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const available = isAvailable(product);
  const cover = product.images[0] ?? "/urunler/hasir-oval-sepet.jpg";

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group relative flex flex-col"
    >
      <Link href={`/urunler/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-sand">
          <Image
            src={cover}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07] ${
              available ? "" : "grayscale-[0.45] opacity-70"
            }`}
          />

          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {product.kind === "unique" ? "Tek parça" : "Siparişe özel"}
          </span>

          {!available && (
            <span className="absolute right-3 top-3 rounded-full bg-bark px-3 py-1 text-[11px] font-semibold text-bg">
              Satıldı
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col">
          <h3 className="font-display text-lg font-semibold leading-snug">{product.title}</h3>
          {product.dimensions && (
            <p className="mt-1 text-sm text-bark-soft">{product.dimensions}</p>
          )}
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="text-base font-semibold">{formatTRY(product.price_kurus)}</span>
            <span className="text-xs text-bark-soft">
              {product.kind === "made_to_order" && product.lead_time_days
                ? `${product.lead_time_days} günde hazır`
                : available
                  ? "Müsait"
                  : "Tükendi"}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
