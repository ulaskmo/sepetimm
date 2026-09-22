"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Scroll-woven hero: the basket is cut into horizontal bands and the bands
 * slide in from alternating sides as the page is pulled down, so the product
 * is literally woven together row by row — which is how the real thing is made.
 *
 * The bands are slices of one photograph, so the finished result is the real
 * image at full fidelity rather than an illustration, and it stays sharp at any
 * width. Every value is driven by motion values, never React state: state here
 * would re-render all 26 bands on every scroll frame.
 */

const STRIPS = 26;
const ALT = "El örgüsü kağıt sepet — keten astarlı, dantel detaylı";

const PHASES = [
  { kicker: "Başlangıç", title: "Önce sadece kağıt", body: "Çöpe gidecek gazete sayfaları. Henüz hiçbir şey değiller." },
  { kicker: "Çubuk", title: "Şeritler çubuğa dönüşür", body: "Her şerit şişle tek tek sarılır. Bir sepet için yüzlerce çubuk gerekir." },
  { kicker: "Örgü", title: "Sıra sıra örülür", body: "Tabandan başlar, yukarı doğru yükselir. Makine yok — eller ve sabır." },
  { kicker: "Tamamlandı", title: "Bir sepet doğar", body: "Astar dikilir, dantel eklenir, deri marka yerine oturur." },
];

/** Fade windows per phase: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] */
const WINDOWS: [number, number, number, number][] = [
  [0, 0, 0.24, 0.3],
  [0.24, 0.3, 0.5, 0.56],
  [0.5, 0.56, 0.8, 0.86],
  [0.8, 0.86, 1.1, 1.2],
];

/** Deterministic jitter — organic-looking scatter that never changes. */
function jitter(i: number, salt: number): number {
  return Math.abs((Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1);
}

/** Percentages are rounded: unrounded floats hydrate differently to how the
 *  browser serialises them, which React reports as a mismatch. */
const pct = (n: number) => `${n.toFixed(4)}%`;

function Strip({ index, src, progress }: { index: number; src: string; progress: MotionValue<number> }) {
  // Bottom rows land first, exactly like weaving a real basket.
  const fromBottom = STRIPS - 1 - index;
  const start = (fromBottom / STRIPS) * 0.72;
  const end = start + 0.28;

  const dir = index % 2 === 0 ? -1 : 1;
  const distance = 320 + jitter(index, 1) * 420;
  const tilt = dir * (4 + jitter(index, 2) * 7);
  const lift = (jitter(index, 3) - 0.5) * 90;

  const x = useTransform(progress, [start, end], [dir * distance, 0], { clamp: true });
  const y = useTransform(progress, [start, end], [lift, 0], { clamp: true });
  const rotate = useTransform(progress, [start, end], [tilt, 0], { clamp: true });
  const opacity = useTransform(progress, [start, start + 0.1, end], [0, 0.85, 1], { clamp: true });
  const filter = useTransform(
    useTransform(progress, [start, end], [6, 0], { clamp: true }),
    (b) => `blur(${b.toFixed(2)}px)`
  );

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x,
        y,
        rotate,
        opacity,
        filter,
        height: pct(100 / STRIPS),
        top: pct((index * 100) / STRIPS),
        backgroundImage: `url(${src})`,
        backgroundSize: `100% ${STRIPS * 100}%`,
        backgroundPosition: `0 ${pct((index / (STRIPS - 1)) * 100)}`,
      }}
      className="absolute inset-x-0 will-change-transform"
    />
  );
}

function Caption({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const [inA, inB, outA, outB] = WINDOWS[index];
  const opacity = useTransform(progress, [inA, inB, outA, outB], [0, 1, 1, 0], { clamp: true });
  const y = useTransform(progress, [inA, inB], [10, 0], { clamp: true });
  const phase = PHASES[index];

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-0 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-bark-soft">{phase.kicker}</p>
      <p className="mt-1.5 font-display text-lg font-semibold sm:text-xl">{phase.title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-bark-soft">{phase.body}</p>
    </motion.div>
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
        className="rounded-full bg-bark px-7 py-3.5 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
      >
        Ürünlere bak
      </Link>
      <Link
        href="/ozel-siparis"
        className="rounded-full border border-line px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-sand"
      >
        Kendi sepetini tarif et
      </Link>
    </div>
  );
}

export function ScrollAssembly({ src }: { src: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const calm = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // A light spring takes the stepiness out of wheel and trackpad scrolling.
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.4 });

  const shadowOpacity = useTransform(smooth, [0.55, 1], [0, 1], { clamp: true });
  const hintOpacity = useTransform(smooth, [0, 0.1], [1, 0], { clamp: true });
  const ctaOpacity = useTransform(smooth, [0.86, 0.99], [0, 1], { clamp: true });
  const ctaY = useTransform(smooth, [0.86, 0.99], [18, 0], { clamp: true });
  const barScale = useTransform(smooth, [0, 1], [0, 1], { clamp: true });

  // Server render, no-JS and reduced-motion all get the finished basket.
  if (!hydrated || calm) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={ALT} className="w-full rounded-[2rem] shadow-[var(--shadow)]" />
        <Actions className="mt-8" />
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <div className="w-full max-w-5xl px-4 sm:px-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-sand">
            {Array.from({ length: STRIPS }, (_, i) => (
              <Strip key={i} index={i} src={src} progress={smooth} />
            ))}

            {/* Contact shadow settles in only once the basket is nearly whole. */}
            <motion.div
              style={{ opacity: shadowOpacity }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[18%] bottom-[7%] h-6 rounded-[50%] bg-bark/25 blur-xl"
            />
          </div>

          {/* Progress */}
          <div className="mx-auto mt-6 h-px w-40 overflow-hidden bg-line">
            <motion.div style={{ scaleX: barScale }} className="h-px w-full origin-left bg-rattan-deep" />
          </div>

          {/* Captions sit below the image so they never cover the product. */}
          <div className="relative mx-auto mt-6 h-28 max-w-lg">
            {PHASES.map((_, i) => (
              <Caption key={i} index={i} progress={smooth} />
            ))}
          </div>

          <motion.p
            style={{ opacity: hintOpacity }}
            className="text-center text-xs uppercase tracking-[0.2em] text-bark-soft"
          >
            Sepeti örmek için kaydırın ↓
          </motion.p>

          <motion.div style={{ opacity: ctaOpacity, y: ctaY }}>
            <Actions />
          </motion.div>
        </div>
      </div>

      {/* The real image, for search engines and anyone without JavaScript. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={ALT} className="w-full rounded-[2rem]" />
      </noscript>
    </section>
  );
}
