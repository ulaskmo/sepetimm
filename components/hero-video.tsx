"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Autoplaying background video.
 *
 * Two things are not optional here:
 *  - a visible pause control, because WCAG 2.2.2 requires one for anything
 *    that plays automatically for more than five seconds;
 *  - honouring prefers-reduced-motion, where we hold the poster frame instead
 *    of playing at all.
 */
export function HeroVideo({
  src,
  poster,
  label,
  className = "",
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const calm = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // State follows the element's own events, so the button never claims to be
    // playing when autoplay was refused (low power mode, data saver).
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    if (calm) {
      video.pause();
    } else {
      video.play().catch(() => {
        /* autoplay refused — the pause button becomes a play button */
      });
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [calm]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Videoyu duraklat" : "Videoyu oynat"}
        className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" fill="currentColor">
          {playing ? (
            <>
              <rect x="2" y="1.5" width="2.6" height="9" />
              <rect x="7.4" y="1.5" width="2.6" height="9" />
            </>
          ) : (
            <path d="M2.5 1.5 10.5 6l-8 4.5z" />
          )}
        </svg>
      </button>
    </div>
  );
}
