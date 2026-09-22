"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/ozel-siparis", label: "Özel Sipariş" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/hikaye", label: "Hikaye" },
];

/**
 * The mobile menu is a native <details>, not React state.
 *
 * It previously used useState, which meant it only worked once React had
 * hydrated — and on at least one real phone it never did, leaving every
 * onClick on the page dead while links kept working. <details> is handled by
 * the browser itself, so the menu opens with no JavaScript at all.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-hair bg-bg">
      <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 lg:px-10">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-[1.35rem] font-semibold leading-none tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <nav aria-label="Ana menü" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative py-1 text-[13px] tracking-wide transition-colors hover:text-bark ${
                      active ? "text-bark" : "text-bark-soft"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-px left-0 h-px w-full origin-left bg-bark transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/hesabim"
            className="hidden text-[13px] tracking-wide text-bark-soft transition-colors hover:text-bark md:block"
          >
            Hesabım
          </Link>

          <details className="group md:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary
              aria-label="Menü"
              style={{ touchAction: "manipulation" }}
              className="-mr-2.5 flex h-11 w-11 cursor-pointer list-none flex-col items-center justify-center gap-[5px]"
            >
              <span
                aria-hidden="true"
                className="h-px w-5 bg-bark transition-transform duration-300 group-open:translate-y-[3px] group-open:rotate-45"
              />
              <span
                aria-hidden="true"
                className="h-px w-5 bg-bark transition-transform duration-300 group-open:-translate-y-[3px] group-open:-rotate-45"
              />
            </summary>

            {/* Anchored to the header bar, so it drops full-width beneath it. */}
            <div className="absolute inset-x-0 top-full border-t border-hair bg-bg">
              <ul className="px-5">
                {[...NAV, { href: "/hesabim", label: "Hesabım" }].map((item) => (
                  <li key={item.href} className="border-b border-hair last:border-0">
                    <Link href={item.href} className="block py-4 text-[15px]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
