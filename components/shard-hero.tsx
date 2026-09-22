"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import { WeaveIn } from "./weave-in";
import { SHARDS } from "@/lib/shards/config";
import { BRAND } from "@/lib/brand";

/**
 * WebGL hero: real refractive glass shards rising through a warm light beam,
 * one shard per scroll beat.
 *
 * three.js is imported dynamically so it never lands in the initial bundle, and
 * the whole thing is progressive enhancement — the copy lives in the DOM either
 * way, and anything without WebGL (or with "reduce motion" on) gets the woven
 * photo hero instead.
 */

let glCache: boolean | null = null;

/**
 * Deliberately narrow. Most visitors arrive on a phone, and transmissive glass
 * is the most expensive thing you can put on a mid-range Android — before you
 * count the ~570KB of three.js over mobile data. The WebGL hero is a desktop
 * enhancement; phones get the reactive photo hero, which is a few KB.
 */
function detectGL(): boolean {
  if (glCache !== null) return glCache;
  try {
    const bigEnough = window.matchMedia("(min-width: 1024px)").matches;
    const realPointer = window.matchMedia("(pointer: fine)").matches;
    const cores = navigator.hardwareConcurrency || 2;
    const phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!bigEnough || !realPointer || phone || cores <= 4) {
      glCache = false;
      return glCache;
    }
    const c = document.createElement("canvas");
    glCache = Boolean(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch {
    glCache = false;
  }
  return glCache;
}

/**
 * Read as an external store rather than in an effect: the value is stable, and
 * setting state synchronously inside an effect causes a cascading re-render.
 * The server snapshot is false, so the markup always ships the DOM hero.
 */
function useWebGL(): boolean {
  return useSyncExternalStore(
    () => () => {},
    detectGL,
    () => false
  );
}

function Actions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-6 ${className}`}>
      <Link
        href="/urunler"
        className="rounded-sm bg-bg px-7 py-3.5 text-[13px] font-medium tracking-wide text-bark transition-opacity hover:opacity-85"
      >
        Ürünleri gör
      </Link>
      <Link
        href="/ozel-siparis"
        className="border-b border-bg/40 pb-0.5 text-[13px] tracking-wide text-bg transition-colors hover:border-bg"
      >
        Özel sipariş ver
      </Link>
    </div>
  );
}

export function ShardHero({ fallbackSrc, fallbackAlt }: { fallbackSrc: string; fallbackAlt: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calm = usePrefersReducedMotion();
  const supported = useWebGL();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const useGl = supported && !calm && !failed;

  useEffect(() => {
    if (!useGl) return;

    let disposed = false;
    let dispose: (() => void) | undefined;
    let onScroll: (() => void) | undefined;
    let observer: ResizeObserver | undefined;

    (async () => {
      const [{ createShardScene }, { fontsReady }] = await Promise.all([
        import("@/lib/shards/scene"),
        import("@/lib/shards/text"),
      ]);
      // The copy is baked into a canvas once, so wait or it uses the fallback face.
      await fontsReady();

      const canvas = canvasRef.current;
      const section = sectionRef.current;
      if (disposed || !canvas || !section) return;

      const scene = createShardScene(canvas);
      dispose = scene.dispose;
      scene.start();
      setReady(true);

      onScroll = () => {
        const rect = section.getBoundingClientRect();
        const travel = section.offsetHeight - window.innerHeight;
        if (travel <= 0) return;
        scene.setProgress(-rect.top / travel);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      observer = new ResizeObserver(() => scene.resize());
      observer.observe(canvas);
    })().catch(() => {
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      if (onScroll) window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      dispose?.();
    };
  }, [useGl]);

  if (!useGl) {
    return (
      <section className="border-b border-hair">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.26em] text-bark-soft">
              {BRAND.city} · El örgüsü
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,5.6vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
              Bir sepet,
              <br />
              yüzlerce
              <br />
              kağıt çubuk.
            </h1>
            <p className="mt-7 max-w-sm text-[15px] leading-relaxed text-bark-soft">
              {BRAND.maker} her parçayı {BRAND.city}&apos;da tek başına örüyor. Stok yok,
              kalıp yok — onay çıkmadan kimseden ödeme almıyoruz.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                href="/urunler"
                className="rounded-sm bg-bark px-7 py-3.5 text-[13px] font-medium tracking-wide text-bg transition-opacity hover:opacity-85"
              >
                Ürünleri gör
              </Link>
              <Link
                href="/ozel-siparis"
                className="border-b border-bark/30 pb-0.5 text-[13px] tracking-wide transition-colors hover:border-bark"
              >
                Özel sipariş ver
              </Link>
            </div>
          </div>
          <WeaveIn src={fallbackSrc} alt={fallbackAlt} className="aspect-4/5 w-full lg:aspect-3/4" />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[260vh] bg-[#191009]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Film grain and vignette, in CSS rather than an extra WebGL pass. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(14,8,4,0.5)_100%)]"
        />

        <div className="relative flex h-full flex-col justify-between px-5 py-10 lg:px-10 lg:py-14">
          <div className="mx-auto w-full max-w-[1400px]">
            <p className="text-[11px] uppercase tracking-[0.26em] text-bg/55">
              {BRAND.city} · El örgüsü
            </p>
            <h1 className="mt-5 max-w-xl font-display text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-bg">
              Bir sepet,
              <br />
              yüzlerce kağıt çubuk.
            </h1>
          </div>

          <div className="mx-auto w-full max-w-[1400px]">
            <Actions />
            <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-bg/40">
              Kaydırın
            </p>
          </div>
        </div>
      </div>

      {/* The shard copy is drawn into WebGL, which crawlers and screen readers
          cannot read — so it lives here too. */}
      <div className="sr-only">
        <h2>{BRAND.name} neden farklı</h2>
        <ul>
          {SHARDS.map((s, i) => (
            <li key={i}>
              {s.big ? `${s.big}${s.sup ?? ""} ` : ""}
              {s.head ? `${s.head} ` : ""}
              {s.lines.map((l) => l.t).join(" ")}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
