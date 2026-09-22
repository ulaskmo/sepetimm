"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import { BRAND } from "@/lib/brand";

/**
 * Full-bleed hero that weaves itself together on arrival.
 *
 * The basket photograph is cut into horizontal bands which fly in from
 * alternating sides and settle bottom-up, the way a real basket is woven.
 * Bands are slices of the real image, so the finished frame is the photograph
 * at full fidelity rather than an illustration.
 *
 * Everything is driven by one motion value, never React state: state here
 * would re-render all 26 bands on every animation frame.
 */

const STRIPS = 26;
const ALT = "El örgüsü kağıt sepet — keten astarlı, dantel detaylı";

/** Source image ratio, so the bands can behave like background-size: cover
 *  without stretching the basket on tall or narrow viewports. */
const IMG_W = 1600;
const IMG_H = 895;

const DURATION = 2.7;

const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, #000 26%), " +
  "linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%)";

/** Deterministic jitter — organic-looking scatter that never changes. */
function jitter(i: number, salt: number): number {
  return Math.abs((Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1);
}

function Strip({ index, src, progress }: { index: number; src: string; progress: MotionValue<number> }) {
  const fromBottom = STRIPS - 1 - index;
  const start = (fromBottom / STRIPS) * 0.72;
  const end = start + 0.28;

  const dir = index % 2 === 0 ? -1 : 1;
  const distance = 340 + jitter(index, 1) * 460;
  const tilt = dir * (4 + jitter(index, 2) * 7);
  const lift = (jitter(index, 3) - 0.5) * 90;

  const x = useTransform(progress, [start, end], [dir * distance, 0], { clamp: true });
  const y = useTransform(progress, [start, end], [lift, 0], { clamp: true });
  const rotate = useTransform(progress, [start, end], [tilt, 0], { clamp: true });
  const opacity = useTransform(progress, [start, start + 0.1, end], [0, 0.85, 1], { clamp: true });
  const filter = useTransform(
    useTransform(progress, [start, end], [7, 0], { clamp: true }),
    (b) => `blur(${b.toFixed(2)}px)`
  );

  // Every band is the same full-size layer showing the whole photo, clipped to
  // its own row. Percentage heights rounded to fractional pixels and leaked
  // hairline gaps between rows; identical boxes with overlapping clips cannot.
  const band = 100 / STRIPS;
  const overlap = 0.35;
  const top = Math.max(0, index * band - overlap);
  const bottom = Math.max(0, 100 - (index + 1) * band - overlap);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x,
        y,
        rotate,
        opacity,
        filter,
        clipPath: `inset(${top.toFixed(4)}% 0% ${bottom.toFixed(4)}% 0%)`,
        backgroundImage: `url(${src})`,
        backgroundSize: "100% 100%",
      }}
      className="absolute inset-0 will-change-transform"
    />
  );
}

/** True only after hydration, so the scattered state is never server-rendered. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function Actions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <Link
        href="/urunler"
        className="rounded-full bg-bark px-7 py-3.5 text-sm font-semibold text-bg shadow-lg transition-transform hover:-translate-y-0.5"
      >
        Ürünlere bak
      </Link>
      <Link
        href="/ozel-siparis"
        className="rounded-full border border-bark/25 bg-bg/70 px-7 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-bg"
      >
        Kendi sepetini tarif et
      </Link>
    </div>
  );
}

function Copy() {
  return (
    <>
      <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-bark/15 bg-bg/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-bark-soft backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-sage" />
        {BRAND.city}&apos;dan el emeği
      </p>
      <h1 className="font-display text-[clamp(2.1rem,5.5vw,3.9rem)] font-semibold leading-[1.05] tracking-tight">
        Tek tek elde örülen
        <br />
        <span className="italic text-rattan-deep">sepetler ve çantalar</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-bark-soft">
        Geri dönüşümlü kağıt çubuk, ip ve rafya — makine yok, kalıp yok.
        Her parça elden çıkar.
      </p>
    </>
  );
}

export function ScrollAssembly({ src }: { src: string }) {
  const hydrated = useHydrated();
  const calm = usePrefersReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (calm) {
      progress.set(1);
      return;
    }
    // No "run once" guard here: StrictMode invokes effects twice, and a guard
    // combined with the cleanup below would stop the first animation and skip
    // the second, leaving the basket permanently in pieces.
    progress.set(0);
    const controls = animate(progress, 1, { duration: DURATION, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [calm, progress]);

  // The frame eases down as the weave completes, so it lands rather than stops.
  const scale = useTransform(progress, [0, 1], [1.05, 1], { clamp: true });
  const copyOpacity = useTransform(progress, [0.55, 0.95], [0, 1], { clamp: true });
  const copyY = useTransform(progress, [0.55, 0.95], [18, 0], { clamp: true });

  // Server render, no-JS and reduced-motion all get the finished picture.
  const still = !hydrated || calm;

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden">
      {/* The photo is anchored to the bottom at its natural ratio rather than
          cover-cropped, so the basket is never cut off and its empty cream
          upper field becomes the space the headline sits in. */}
      <motion.div
        style={{
          ...(still ? {} : { scale }),
          // Fades the top edge away so the photo reads as page background
          // rather than a picture sitting in a box.
        }}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 origin-bottom overflow-hidden"
      >
        <div
          // Width-driven with the aspect ratio intact, anchored to the bottom:
          // the photo spans the full viewport and its empty upper field is
          // cropped away, so the basket sits low and nothing is distorted.
          // Phones widen it slightly so the basket is not tiny.
          className="absolute bottom-0 left-1/2 w-[138%] -translate-x-1/2 sm:w-[72%] sm:max-w-[940px]"
          style={{
            aspectRatio: `${IMG_W} / ${IMG_H}`,
            // Top and both sides dissolve into the page, so the photo reads as
            // background rather than a picture sitting in a rectangle.
            maskImage: EDGE_FADE,
            maskComposite: "intersect",
            maskRepeat: "no-repeat",
            WebkitMaskImage: EDGE_FADE,
            WebkitMaskComposite: "source-in",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          {still ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          ) : (
            Array.from({ length: STRIPS }, (_, i) => (
              <Strip key={i} index={i} src={src} progress={progress} />
            ))
          )}
        </div>
      </motion.div>

      {/* Softens the photo where the type overlaps it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg from-18% to-transparent to-46%"
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 pt-16 text-center sm:px-6 md:pt-20">
        {still ? (
          <div>
            <Copy />
            <Actions className="mt-8" />
          </div>
        ) : (
          <motion.div style={{ opacity: copyOpacity, y: copyY }}>
            <Copy />
            <Actions className="mt-8" />
          </motion.div>
        )}
      </div>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={ALT} className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl" />
      </noscript>
    </section>
  );
}
