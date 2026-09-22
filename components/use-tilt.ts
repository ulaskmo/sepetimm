"use client";

import { useEffect } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

export type TiltValues = { tiltX: MotionValue<number>; tiltY: MotionValue<number> };

/**
 * Pointer/touch position over an element as -1..1 per axis, damped.
 *
 * Touch is read directly rather than through device orientation: the
 * gyroscope needs an explicit permission prompt on iOS, and asking a shopper
 * for motion access on the front page is a good way to lose them.
 *
 * The value lives in motion values, not React state — state here would
 * re-render every band of the hero on every animation frame.
 */
export function useTilt(ref: React.RefObject<HTMLElement | null>, enabled = true): TiltValues {
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let raf = 0;
    let idle = true;
    let tx = 0;
    let ty = 0;

    const set = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      idle = false;
      tx = ((clientX - r.left) / r.width) * 2 - 1;
      ty = ((clientY - r.top) / r.height) * 2 - 1;
    };

    const onPointer = (e: PointerEvent) => set(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) set(t.clientX, t.clientY);
    };
    const onLeave = () => {
      idle = true;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (idle) {
        // A slow drift keeps it alive when nothing is touching it.
        const t = performance.now() / 1000;
        tx = Math.sin(t * 0.35) * 0.24;
        ty = Math.cos(t * 0.27) * 0.18;
      }
      tiltX.set(tiltX.get() + (tx - tiltX.get()) * 0.07);
      tiltY.set(tiltY.get() + (ty - tiltY.get()) * 0.07);
    };

    el.addEventListener("pointermove", onPointer, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    // No preventDefault on touchmove, so the page still scrolls normally.
    el.addEventListener("touchmove", onTouch, { passive: true });
    el.addEventListener("touchend", onLeave, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("touchend", onLeave);
    };
  }, [ref, enabled, tiltX, tiltY]);

  return { tiltX, tiltY };
}
