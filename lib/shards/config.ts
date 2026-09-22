/**
 * Glass-shard hero — tuning and copy.
 *
 * Technique follows the documented approach behind why.zero.university's
 * shard section: beveled extrusions with a transmissive material so the glass
 * genuinely refracts a backdrop *mesh* (not scene.background — a background
 * texture is not captured into the transmission buffer and will not refract),
 * with the type baked in as an emissive map rather than floating in front.
 *
 * Palette is warm amber/cream rather than the red of the original: this is a
 * handmade basket shop, not a bleak statistics deck.
 */

export type Quality = "low" | "medium" | "high";

export function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "low";
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  if (mobile || cores <= 4) return "low";
  if (cores <= 8) return "medium";
  return "high";
}

export const tune = (q: Quality) => ({
  cameraZ: 7,
  fov: 38,

  glass: {
    ior: 1.58,
    // Per-channel refraction (three r166+). Three extra samples per pixel, so
    // it is the second biggest cost after the transmission buffer itself.
    dispersion: { low: 0, medium: 2.2, high: 5.5 }[q],
    roughness: 0.07,
    thickness: 0.9,
    iridescence: { low: 0, medium: 0.45, high: 0.8 }[q],
    attenuationColor: 0xf0d3ae,
    attenuationDistance: 3.4,
  },

  scroll: { damping: 0.07 },

  /** Resolution of the refraction buffer — the single biggest perf lever. */
  transmissionScale: { low: 0.3, medium: 0.5, high: 0.7 }[q],
  debris: { low: 8, medium: 18, high: 28 }[q],
});

export type ShardLine = {
  t: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  style?: "italic" | "roman";
  center?: boolean;
};

export type ShardSpec = {
  big?: string;
  sup?: string;
  bigX?: number;
  bigY?: number;
  bigSize?: number;
  head?: string;
  headY?: number;
  lines: ShardLine[];
  side: "left" | "right" | "center";
  scale: number;
  tilt: [number, number, number];
};

export const SHARDS: ShardSpec[] = [
  {
    big: "100",
    sup: "%",
    bigX: 0.16,
    bigY: 0.56,
    bigSize: 0.4,
    lines: [
      { t: "el işi", x: 0.56, y: 0.34, rot: -0.18, size: 0.11, style: "italic" },
      { t: "makine yok,", x: 0.56, y: 0.5, rot: -0.18, size: 0.08 },
      { t: "kalıp yok", x: 0.56, y: 0.61, rot: -0.18, size: 0.08 },
    ],
    side: "right",
    scale: 1.02,
    tilt: [-0.2, 0.28, 0.12],
  },
  {
    big: "0",
    bigX: 0.2,
    bigY: 0.58,
    bigSize: 0.46,
    lines: [
      { t: "stok", x: 0.56, y: 0.4, rot: -0.14, size: 0.12, style: "italic" },
      { t: "her parça", x: 0.5, y: 0.58, rot: -0.14, size: 0.08 },
      { t: "tek tek örülür", x: 0.5, y: 0.7, rot: -0.14, size: 0.08 },
    ],
    side: "left",
    scale: 1.05,
    tilt: [0.16, -0.24, -0.1],
  },
  {
    head: "Önce onay, sonra ödeme",
    headY: 0.42,
    lines: [
      { t: "talebiniz onaylanmadan", x: 0.5, y: 0.62, rot: 0, size: 0.075, center: true },
      { t: "kartınızdan hiçbir şey çekilmez", x: 0.5, y: 0.73, rot: 0, size: 0.075, center: true },
    ],
    side: "center",
    scale: 1.12,
    tilt: [0.08, 0.12, 0.05],
  },
];
