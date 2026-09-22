"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { usePrefersReducedMotion } from "./use-reduced-motion";
import { useTilt } from "./use-tilt";

/**
 * Fills its container with a photograph that weaves itself together on arrival:
 * the image is cut into horizontal bands which slide in from alternating sides
 * and settle bottom-up, the way the baskets are actually made.
 *
 * Bands are clipped copies of one real photograph, so the finished frame is the
 * photo at full fidelity. Everything runs off a single motion value — React
 * state here would re-render every band on every frame.
 */

const STRIPS = 24;
const DURATION = 2.4;

/** Deterministic jitter — organic-looking scatter that never changes. */
function jitter(i: number, salt: number): number {
  return Math.abs((Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453) % 1);
}

function Band({
  index,
  src,
  progress,
  tiltX,
}: {
  index: number;
  src: string;
  progress: MotionValue<number>;
  tiltX: MotionValue<number>;
}) {
  const fromBottom = STRIPS - 1 - index;
  const start = (fromBottom / STRIPS) * 0.7;
  const end = start + 0.3;

  const dir = index % 2 === 0 ? -1 : 1;
  const distance = 55 + jitter(index, 1) * 70; // percent of container width
  const tilt = dir * (2 + jitter(index, 2) * 4);

  const enter = useTransform(progress, [start, end], [dir * distance, 0], { clamp: true });

  // Bands further from the middle shear further, so dragging a finger across
  // the photo bends it like a woven panel catching the light. A few pixels is
  // enough — more and the rows stop lining up and it just looks broken.
  const depth = (index / (STRIPS - 1) - 0.5) * 2;
  const shear = useTransform(tiltX, (t) => t * depth * 7);
  const x = useTransform([enter, shear], ([e, sh]: number[]) => `calc(${e}% + ${sh}px)`);
  const rotate = useTransform(progress, [start, end], [tilt, 0], { clamp: true });
  const opacity = useTransform(progress, [start, start + 0.12, end], [0, 0.9, 1], { clamp: true });

  // Identical full-size layers clipped to their own row. Percentage heights
  // round to fractional pixels and leak hairline gaps; overlapping clips of
  // identical boxes cannot.
  const band = 100 / STRIPS;
  const top = Math.max(0, index * band - 0.3);
  const bottom = Math.max(0, 100 - (index + 1) * band - 0.3);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x,
        rotate,
        opacity,
        clipPath: `inset(${top.toFixed(4)}% 0% ${bottom.toFixed(4)}% 0%)`,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
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

export function WeaveIn({
  src,
  alt,
  className = "",
  delay = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
}) {
  const hydrated = useHydrated();
  const calm = usePrefersReducedMotion();
  const progress = useMotionValue(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const { tiltX, tiltY } = useTilt(hostRef, hydrated && !calm);

  const rotateY = useTransform(tiltX, (t) => t * 5);
  const rotateX = useTransform(tiltY, (t) => t * -3.5);

  useEffect(() => {
    if (calm) {
      progress.set(1);
      return;
    }
    // No "run once" guard: StrictMode invokes effects twice, and a guard plus
    // the cleanup below would stop the first run and skip the second, leaving
    // the picture permanently in pieces.
    progress.set(0);
    const controls = animate(progress, 1, {
      duration: DURATION,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [calm, progress, delay]);

  // Server render, no-JS and reduced motion all get the finished photograph.
  if (!hydrated || calm) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={alt}
      className={`relative ${className}`}
      style={{ perspective: 900 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative h-full w-full overflow-hidden bg-sand"
      >
        {Array.from({ length: STRIPS }, (_, i) => (
          <Band key={i} index={i} src={src} progress={progress} tiltX={tiltX} />
        ))}
      </motion.div>
    </div>
  );
}
