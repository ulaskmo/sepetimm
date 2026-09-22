import crypto from "node:crypto";

/**
 * Bunny Stream token authentication. The player URL is only valid for a short
 * window and is minted per request, so a paid video link cannot be passed on.
 * Enable "Token Authentication" on the Bunny Stream library for this to bite.
 */

const TTL_SEC = 60 * 60 * 3; // long enough to watch and rewind a 10dk video

export function embedUrl(videoId: string): string | null {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const key = process.env.BUNNY_TOKEN_KEY;
  if (!libraryId) return null;

  const expires = Math.floor(Date.now() / 1000) + TTL_SEC;
  const base = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

  if (!key) {
    // No token key configured yet: play unsigned so local dev still works.
    return base;
  }

  const token = crypto
    .createHash("sha256")
    .update(key + videoId + expires)
    .digest("hex");

  return `${base}?token=${token}&expires=${expires}`;
}

export function thumbnailUrl(videoId: string): string | null {
  const host = process.env.BUNNY_CDN_HOSTNAME;
  return host ? `https://${host}/${videoId}/thumbnail.jpg` : null;
}
