"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Inline hero video that behaves on phones.
 *
 * The whole surface is a real <button>, not a div with onClick. iOS Safari
 * does not reliably dispatch click on non-interactive elements, which is why
 * tapping did nothing and repeated taps just selected the text underneath.
 *
 *  - iOS WebKit needs muted + playsinline as real attributes to play inline.
 *  - play() is reached synchronously from the tap: awaiting anything first
 *    ends the user-gesture window and the browser refuses.
 *  - Only metadata is fetched up front; playback pauses when scrolled away.
 *  - A manual pause is respected — the observer must not restart it.
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

  function startPlayback(video: HTMLVideoElement) {
    video.muted = true;
    if (video.readyState === 0) video.load();
    const p = video.play();
    if (p) p.then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

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
          if (!userPausedRef.current) startPlayback(video);
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

  // Not async: an await before play() would end the user gesture.
  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      startPlayback(video);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        className="pointer-events-none h-full w-full object-cover"
      />

      {/* One real button over the whole clip. Everything else is decoration
          inside it, so there are no nested interactive elements. */}
      <button
        type="button"
        onClick={toggle}
        style={{ touchAction: "manipulation" }}
        aria-label={
          playing ? `${label} — duraklatmak için dokunun` : `${label} — oynatmak için dokunun`
        }
        className="absolute inset-0 flex h-full w-full cursor-pointer select-none appearance-none items-center justify-center bg-transparent p-0"
      >
        {!playing && (
          <span className="pointer-events-none flex flex-col items-center bg-black/35 px-6 py-5">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-white/50 bg-black/45 text-white">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white">
              Oynatmak için dokunun
            </span>
          </span>
        )}

        {/* Always-visible state indicator, so the control is discoverable
            while playing too (WCAG 2.2.2). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/55 text-white"
        >
          <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor">
            {playing ? (
              <>
                <rect x="2" y="1.5" width="2.6" height="9" />
                <rect x="7.4" y="1.5" width="2.6" height="9" />
              </>
            ) : (
              <path d="M2.5 1.5 10.5 6l-8 4.5z" />
            )}
          </svg>
        </span>
      </button>
    </div>
  );
}
