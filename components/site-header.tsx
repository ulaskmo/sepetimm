"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/ozel-siparis", label: "Özel Sipariş" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/hikaye", label: "Hikaye" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hair bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 lg:px-10">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-baseline gap-2.5">
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

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          >
            <span
              className={`h-px w-5 bg-bark transition-transform duration-300 ${
                open ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-bark transition-transform duration-300 ${
                open ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-hair transition-[max-height] duration-300 md:hidden ${
          open ? "max-h-72" : "max-h-0 border-t-0"
        }`}
      >
        <ul className="px-5 py-2">
          {[...NAV, { href: "/hesabim", label: "Hesabım" }].map((item) => (
            <li key={item.href} className="border-b border-hair last:border-0">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3.5 text-[15px]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
