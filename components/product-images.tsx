"use client";

import { useRef, useState } from "react";

/**
 * Photo picker for the admin product form.
 *
 * The browser shrinks each photo to a web size before uploading. Phone photos
 * are 3-5MB; sending those raw would hit the serverless body limit and store
 * images far larger than the page ever renders. Resizing here also means no
 * image library on the server and no CORS setup for direct-to-bucket uploads.
 */

const MAX_EDGE = 1400;
const QUALITY = 0.85;

async function shrink(file: File): Promise<Blob> {
  // PNGs may carry transparency that must survive; leave them alone.
  if (file.type === "image/png") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900_000) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", QUALITY)
  );
  return blob && blob.size < file.size ? blob : file;
}

export function ProductImages({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError("");

    const added: string[] = [];
    for (const file of files) {
      try {
        const blob = await shrink(file);
        const body = new FormData();
        body.append("dosya", blob, file.name);
        const res = await fetch("/api/admin/gorsel", { method: "POST", body });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error || "Yükleme başarısız.");
        added.push(data.url);
      } catch (err) {
        setError((err as Error).message);
        break;
      }
    }

    if (added.length) setUrls((prev) => [...prev, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  function move(index: number, delta: number) {
    setUrls((prev) => {
      const next = [...prev];
      const to = index + delta;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  return (
    <div>
      {/* The form still posts a newline-separated list, so the server action
          is unchanged and pasted URLs keep working. */}
      <input type="hidden" name="images" value={urls.join("\n")} />

      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {urls.map((url, i) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Görsel ${i + 1}`}
                className="aspect-square w-full border border-hair object-cover"
              />
              {i === 0 && (
                <span className="absolute left-0 top-0 bg-bark px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-bg">
                  Kapak
                </span>
              )}
              <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Öne al"
                  className="px-1 text-bark-soft disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="px-1 text-red-600 dark:text-red-400"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === urls.length - 1}
                  aria-label="Geri al"
                  className="px-1 text-bark-soft disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        id="urun-foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onPick}
        className="sr-only"
      />
      <label
        htmlFor="urun-foto"
        className="flex cursor-pointer items-center justify-center border border-dashed border-hair px-4 py-6 text-center text-[13px] text-bark-soft transition-colors hover:border-rattan hover:text-bark"
      >
        {busy ? "Yükleniyor…" : "Telefondan fotoğraf seç (birden fazla seçebilirsiniz)"}
      </label>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-bark-soft">
        İlk görsel kapak fotoğrafı olur. Oklarla sıralayabilirsiniz.
      </p>
    </div>
  );
}
