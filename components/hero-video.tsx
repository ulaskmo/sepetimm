"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Hero video using the browser's own controls.
 *
 * Every custom control I tried failed on the customer's phone: a div with
 * onClick, then a real <button> — both dead, because nothing on the page that
 * depended on React actually ran there. Native `controls` are rendered and
 * handled by the browser, so the video is playable even if no JavaScript
 * executes at all.
 *
 * The autoplay below is pure enhancement: when scripting works the clip plays
 * muted on scroll-in and pauses on the way out. When it does not, the visitor
 * gets an ordinary play button that has never needed help.
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

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Real attributes, not just properties — iOS needs these to play inline.
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    // If the visitor works the native controls, respect that over autoplay.
    const onPause = () => {
      if (!video.ended) userPausedRef.current = true;
    };
    const onPlay = () => {
      userPausedRef.current = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (calm) return;
        if (entry.isIntersecting) {
          if (!userPausedRef.current && video.paused) {
            if (video.readyState === 0) video.load();
            void video.play().catch(() => {
              /* refused — the native play button is right there */
            });
          }
        } else if (!video.paused) {
          video.pause();
          // Pausing ourselves is not the visitor pausing.
          userPausedRef.current = false;
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(container);

    return () => {
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
      observer.disconnect();
    };
  }, [calm]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        controlsList="nodownload"
        muted
        playsInline
        loop
        preload="metadata"
        aria-label={label}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
