"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { BRAND } from "@/lib/brand";

const NAV = [
  { href: "/urunler", label: "Sepetler" },
  { href: "/ozel-siparis", label: "Özel Sipariş" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/hikaye", label: "Hikayemiz" },
  { href: "/hesabim", label: "Hesabım" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setStuck(y > 24));

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50"
    >
      <div
        className={`transition-all duration-500 ${
          stuck
            ? "bg-bg/85 backdrop-blur-xl border-b border-line"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <WeaveMark />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold tracking-tight">
                {BRAND.name}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-bark-soft">
                {BRAND.city}
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative block rounded-full px-4 py-2 text-sm font-medium text-bark-soft transition-colors hover:text-bark"
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-sand"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className={`relative ${active ? "text-bark" : ""}`}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="rounded-full border border-line p-2.5 md:hidden"
          >
            <span className="sr-only">Menü</span>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <motion.path
                animate={{ d: open ? "M3 3 L15 15" : "M2 5 L16 5" }}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <motion.path
                animate={{ opacity: open ? 0 : 1, d: "M2 9 L16 9" }}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <motion.path
                animate={{ d: open ? "M3 15 L15 3" : "M2 13 L16 13" }}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>

        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden md:hidden"
        >
          <ul className="flex flex-col gap-1 border-t border-line px-4 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.header>
  );
}

/** Tiny woven square — the logo mark, drawn the way the baskets are woven. */
function WeaveMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="32" height="32" rx="10" fill="var(--sand)" />
      {[9, 14, 19, 24].map((y, i) => (
        <motion.line
          key={`h${y}`}
          x1="7"
          x2="27"
          y1={y}
          y2={y}
          stroke="var(--rattan-deep)"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: "easeOut" }}
        />
      ))}
      {[11, 17, 23].map((x, i) => (
        <motion.line
          key={`v${x}`}
          y1="7"
          y2="27"
          x1={x}
          x2={x}
          stroke="var(--rattan)"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.35 + i * 0.08, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}
