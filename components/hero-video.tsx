"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Mobile-reliable hero video component.
 * Ensures seamless inline playback on iOS and Android:
 *  - Explicit autoPlay, muted, playsInline attributes on JSX
 *  - IntersectionObserver to start playback when scrolled into viewport on phones
 *  - Whole-surface tap-to-toggle with clear visible play indicator if paused by battery saver
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
  const calm = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mobile WebKit strict inline audio-less autoplay flags
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    if (calm) {
      video.pause();
    } else {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setPlaying(true))
          .catch(() => {
            // Autoplay prevented by browser on phone (Low Power Mode)
            setPlaying(false);
          });
      }
    }

    // Scroll into view trigger on mobile
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !calm) {
            const p = video.play();
            if (p !== undefined) {
              p.then(() => setPlaying(true)).catch(() => {});
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      observer.disconnect();
    };
  }, [calm]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      video
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
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
          toggle();
        }
      }}
      className={`group relative cursor-pointer select-none overflow-hidden ${className}`}
      aria-label={`${label} — Oynatmak veya duraklatmak için dokunun`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        aria-label={label}
        className="h-full w-full object-cover"
      />

      {/* Tap-to-play overlay: Visible on mobile phones when paused/held by battery saver */}
      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/20 text-white shadow-xl backdrop-blur-md transition-transform active:scale-95">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="currentColor"
              className="translate-x-0.5"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="mt-3 text-[11px] font-mono font-medium uppercase tracking-[0.2em] text-white drop-shadow">
            Oynatmak için dokunun
          </span>
        </div>
      )}

      {/* Corner Play/Pause Controller */}
      <div className="absolute bottom-3 right-3 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={playing ? "Videoyu duraklat" : "Videoyu oynat"}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md transition-opacity hover:bg-black/70"
        >
          {playing ? (
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="currentColor">
              <rect x="2" y="1.5" width="2.6" height="9" />
              <rect x="7.4" y="1.5" width="2.6" height="9" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="currentColor">
              <path d="M2.5 1.5 10.5 6l-8 4.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
