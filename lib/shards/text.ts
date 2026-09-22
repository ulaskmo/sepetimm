import * as THREE from "three";
import type { Quality, ShardSpec } from "./config";

/**
 * Bakes each shard's copy into a canvas used as the glass emissiveMap.
 *
 * Deliberately not a separate text mesh in front of the glass: a second mesh
 * also lands in the transmission buffer, so you get a ghosted copy of the type
 * refracted through its own shard. Baking it in keeps one draw call per shard
 * and lets the letters pick up the edge refraction.
 */

const SIZE: Record<Quality, number> = { low: 1024, medium: 1536, high: 2048 };

/** Uses the site's display face when it has loaded, else a serif fallback. */
function displayFamily(): string {
  if (typeof document === "undefined") return "Georgia, serif";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-fraunces")
    .trim();
  return v ? `${v}, Georgia, serif` : "Georgia, serif";
}

export function makeShardTexture(spec: ShardSpec, quality: Quality): THREE.CanvasTexture {
  const S = SIZE[quality];
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const family = displayFamily();

  // Black is "no emission" — only the glyphs light up.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";

  if (spec.big) {
    const px = (spec.bigSize ?? 0.42) * S;
    ctx.font = `600 ${px}px ${family}`;
    ctx.textAlign = "left";
    const x = (spec.bigX ?? 0.16) * S;
    const y = (spec.bigY ?? 0.56) * S;
    ctx.fillText(spec.big, x, y);

    if (spec.sup) {
      const w = ctx.measureText(spec.big).width;
      ctx.font = `600 ${px * 0.34}px ${family}`;
      ctx.fillText(spec.sup, x + w + px * 0.03, y - px * 0.42);
    }
  }

  if (spec.head) {
    ctx.font = `600 ${0.1 * S}px ${family}`;
    ctx.textAlign = "center";
    ctx.fillText(spec.head, S / 2, (spec.headY ?? 0.42) * S);
  }

  for (const line of spec.lines) {
    ctx.save();
    ctx.translate(line.x * S, line.y * S);
    ctx.rotate(line.rot);
    ctx.font = `${line.style === "italic" ? "italic " : ""}500 ${line.size * S}px ${family}`;
    ctx.textAlign = line.center ? "center" : "left";
    ctx.fillText(line.t, 0, 0);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** The copy is drawn once, so wait for webfonts or it bakes in the fallback. */
export async function fontsReady(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await document.fonts.ready;
  } catch {
    /* fall through to the serif fallback */
  }
}
