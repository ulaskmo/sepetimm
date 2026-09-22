"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Inline hero video that behaves on phones.
 *
 *  - iOS WebKit needs muted + playsinline set as real attributes before it will
 *    play inline without going fullscreen.
 *  - It only loads and plays once scrolled into view, and pauses again on the
 *    way out: a 4MB clip that autoloads on every page view is a bad trade on
 *    mobile data, and off-screen playback is wasted battery.
 *  - A manual pause is respected. Previously the observer restarted playback
 *    the moment the page moved, so pausing looked broken.
 *  - A visible control is not optional: WCAG 2.2.2 requires one for anything
 *    that plays automatically for more than five seconds.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userPausedRef = useRef(false);
  const calm = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);

  /** Resolves false when the browser refuses (low power mode, data saver). */
  async function attemptPlay(video: HTMLVideoElement): Promise<boolean> {
    try {
      await video.play();
      return true;
    } catch {
      // Nothing buffered yet — nudge it once and retry.
      if (video.readyState === 0) {
        try {
          video.load();
          await video.play();
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Must be real attributes, not just properties, for iOS inline playback.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (calm) return;
        if (entry.isIntersecting) {
          // Never fight an explicit pause.
          if (!userPausedRef.current) void attemptPlay(video);
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(container);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      observer.disconnect();
    };
  }, [calm]);

  async function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      const ok = await attemptPlay(video);
      setPlaying(ok);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          void toggle();
        }
      }}
      aria-label={`${label} — oynatmak veya duraklatmak için dokunun`}
      className={`group relative cursor-pointer select-none overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        // Not "auto": the clip is only fetched once it scrolls into view.
        preload="none"
        aria-label={label}
        className="h-full w-full object-cover"
      />

      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/35">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white">
            Oynatmak için dokunun
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void toggle();
        }}
        aria-label={playing ? "Videoyu duraklat" : "Videoyu oynat"}
        className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
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
