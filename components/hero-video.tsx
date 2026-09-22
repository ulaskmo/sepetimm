"use client";

import { useEffect, useRef, useState } from "react";

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
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm.matches) {
      video.pause();
      setPlaying(false);
      return;
    }
    // Autoplay can still be refused (low power mode, data saver) — reflect
    // reality in the button rather than lying about it.
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    } else {
      video.pause();
      setPlaying(false);
    }
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
        <span aria-hidden="true" className="text-sm leading-none">
          {playing ? "❚❚" : "▶"}
        </span>
      </button>
    </div>
  );
}
