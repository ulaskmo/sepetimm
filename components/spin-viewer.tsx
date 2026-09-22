"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drag-to-rotate 360° product viewer.
 *
 * Frames come from the turntable video Eda already shot, extracted to JPEGs:
 * scrubbing a <video> by currentTime stutters badly on iOS Safari and on any
 * clip with sparse keyframes, while a preloaded image sequence drawn to one
 * canvas is rock solid on a phone.
 *
 * touch-action is pan-y, so a horizontal drag spins the product and a vertical
 * drag still scrolls the page — never trap the scroll on a shop.
 */

const IDLE_MS_PER_FRAME = 130;
const FRICTION = 0.94;

export function SpinViewer({
  dir,
  frames,
  alt,
  className = "",
}: {
  dir: string;
  frames: number;
  alt: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);

  // Frame index and motion live in refs: this repaints every frame, and React
  // state here would re-render the component 60 times a second.
  const frameRef = useRef(0);
  const velRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const touchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;

    const imgs = Array.from({ length: frames }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = `${dir}/${String(i).padStart(2, "0")}.jpg`;
      img.onload = img.onerror = () => {
        loaded += 1;
        // Draw the first frame the moment it exists so the slot is never empty.
        if (i === 0 && !cancelled) draw();
        if (loaded === frames && !cancelled) setReady(true);
      };
      return img;
    });
    imgsRef.current = imgs;

    function draw() {
      const canvas = canvasRef.current;
      const list = imgsRef.current;
      if (!canvas || list.length === 0) return;
      const idx = ((Math.round(frameRef.current) % frames) + frames) % frames;
      const img = list[idx];
      if (!img?.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Cover-fit: the frames are 500x703 and the slot may be any ratio, so
      // stretching to the canvas box would squash the product.
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = canvas.width / canvas.height;
      const dw = ir > cr ? canvas.height * ir : canvas.width;
      const dh = ir > cr ? canvas.height : canvas.width / ir;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    }

    function resize() {
      const canvas = canvasRef.current;
      const host = hostRef.current;
      if (!canvas || !host) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(host.clientWidth * dpr);
      canvas.height = Math.round(host.clientHeight * dpr);
      draw();
    }

    const ro = new ResizeObserver(resize);
    if (hostRef.current) ro.observe(hostRef.current);
    resize();

    let raf = 0;
    let lastTick = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - lastTick;
      lastTick = now;

      if (!draggingRef.current) {
        if (Math.abs(velRef.current) > 0.002) {
          // Let a flick carry on and settle.
          frameRef.current += velRef.current;
          velRef.current *= FRICTION;
        } else if (!touchedRef.current) {
          // Gentle idle rotation, until someone takes over.
          frameRef.current += dt / IDLE_MS_PER_FRAME;
        }
      }
      draw();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [dir, frames]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    touchedRef.current = true;
    setTouched(true);
    lastXRef.current = e.clientX;
    velRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const host = hostRef.current;
    if (!host) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    // One drag across the element ≈ one full rotation.
    const perFrame = host.clientWidth / frames;
    const step = dx / perFrame;
    frameRef.current += step;
    velRef.current = step;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={alt}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "pan-y" }}
      className={`relative select-none overflow-hidden bg-sand ${
        touched ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
    >
      <canvas ref={canvasRef} className="h-full w-full" />

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 transition-opacity duration-500 ${
          touched ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="flex items-center gap-2 bg-bark/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-bg backdrop-blur-sm">
          <svg viewBox="0 0 24 8" width="24" height="8" aria-hidden="true" fill="none">
            <path
              d="M1 4h22M4 1 1 4l3 3M20 1l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Sürükleyip çevirin
        </span>
      </div>

      {!ready && (
        <span className="pointer-events-none absolute right-3 top-3 text-[10px] uppercase tracking-[0.2em] text-bark-soft">
          Yükleniyor
        </span>
      )}

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dir}/00.jpg`} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      </noscript>
    </div>
  );
}
