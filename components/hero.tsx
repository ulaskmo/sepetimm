"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { HeroVideo } from "./hero-video";
import { WordsUp } from "./motion-primitives";
import { BRAND } from "@/lib/brand";

export function Hero({ video, poster, mediaAlt }: { video: string; poster: string; mediaAlt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // The photo drifts up slower than the page, the copy drifts away faster.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <WovenBackdrop />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-10 sm:px-6 md:grid-cols-2 md:gap-14 md:pb-28 md:pt-16">
        <motion.div style={{ y: copyY, opacity: copyOpacity }} className="order-2 md:order-1">
          <p
            className="rise-in mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-raised/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-bark-soft backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sage" />
            {BRAND.city}&apos;dan el emeği
          </p>

          <h1 className="font-display text-[clamp(2.4rem,7vw,4.2rem)] font-semibold leading-[1.03] tracking-tight">
            <WordsUp text="Tek tek elde örülen" />
            <br />
            <span className="italic text-rattan-deep">
              <WordsUp text="sepetler ve çantalar" />
            </span>
          </h1>

          <p
            style={{ animationDelay: "0.5s" }}
            className="rise-in mt-6 max-w-md text-base leading-relaxed text-bark-soft sm:text-lg"
          >
            Geri dönüşümlü kağıt çubuk, ip ve rafya — hepsi saatler süren bir
            sabırla, elde örülür. Makine yok, kalıp yok; her parça elden çıkar
            ve hiçbiri diğerinin aynısı değildir.
          </p>

          <div
            style={{ animationDelay: "0.66s" }}
            className="rise-in mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/urunler"
              className="group inline-flex items-center gap-2 rounded-full bg-bark px-7 py-3.5 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              Ürünlere bak
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/kurslar"
              className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-sand"
            >
              Örmeyi öğren
            </Link>
          </div>
        </motion.div>

        <div className="order-1 md:order-2">
          <div className="photo-in relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-[var(--shadow)]">
            <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0">
              <HeroVideo src={video} poster={poster} label={mediaAlt} className="h-full w-full" />
            </motion.div>

            <div
              style={{ animationDelay: "1.1s" }}
              className="rise-in absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-black/35 px-4 py-3 text-white backdrop-blur-md"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm">
                ✿
              </span>
              <p className="text-xs leading-snug">
                Her parçada <strong className="font-semibold">@{BRAND.handle}</strong>{" "}
                markası — elden çıktığının imzası.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Slowly breathing woven lattice behind the hero. */
function WovenBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6 }}
        className="absolute -right-24 -top-24 h-[36rem] w-[36rem] rounded-full bg-sand blur-3xl"
        style={{ opacity: 0.55 }}
      />
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-sage/20 blur-3xl"
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden="true">
        <defs>
          <pattern id="weave" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M0 13h26M13 0v26" stroke="var(--rattan)" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#weave)" />
      </svg>
    </div>
  );
}
