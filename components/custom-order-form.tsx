"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const field =
  "w-full rounded-sm border border-hair bg-bg px-4 py-3 text-sm outline-none transition-colors placeholder:text-bark-soft/55 focus:border-rattan";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function CustomOrderForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");

    if (!file) {
      setPreview(null);
      setFileName("");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Fotoğraf 8 MB'tan küçük olmalı.");
      e.target.value = "";
      return;
    }
    setFileName(file.name);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    try {
      // Sent as multipart so the photo rides along with the measurements.
      const res = await fetch("/api/ozel-siparis", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Talep gönderilemedi.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === "sent" ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-none border border-hair bg-raised p-10 text-center shadow-[var(--shadow)]"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage/20 text-sage"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none"><path d="M2 8.5 6 12.5 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.span>
          <p className="mt-5 font-display text-xl font-semibold">Talebiniz Eda&apos;ya iletildi</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bark-soft">
            Görseliniz ve ölçüleriniz ulaştı. Eda inceleyip sizin için bir fiyat
            belirleyecek ve e-posta gönderecek. <strong>Şu an ödeme yapmanız
            gerekmiyor</strong> — fiyatı gördükten sonra karar verirsiniz.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8 rounded-none border border-hair bg-raised p-7 shadow-[var(--shadow)] sm:p-9"
        >
          {/* 1 — örnek görsel */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold">1. Örnek görsel</legend>
            <p className="text-sm leading-relaxed text-bark-soft">
              Aklınızdaki sepetin fotoğrafını, çizimini ya da beğendiğiniz bir
              örneği yükleyin. İsteğe bağlı ama çok yardımcı olur.
            </p>

            <input
              ref={fileInput}
              type="file"
              name="photo"
              accept="image/*"
              onChange={onPick}
              className="sr-only"
              id="ozel-foto"
            />

            {preview ? (
              <div className="flex items-center gap-4 rounded-sm border border-hair bg-bg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Yüklediğiniz görselin önizlemesi"
                  className="h-20 w-20 rounded-sm object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fileName}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInput.current) fileInput.current.value = "";
                      if (preview) URL.revokeObjectURL(preview);
                      setPreview(null);
                      setFileName("");
                    }}
                    className="mt-1 text-xs text-bark-soft underline hover:text-rattan-deep"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="ozel-foto"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed border-hair bg-bg px-6 py-10 text-center transition-colors hover:border-rattan hover:bg-sand/40"
              >
                <span className="text-[13px] font-medium underline underline-offset-4">
                  Fotoğraf seç
                </span>
                <span className="text-xs text-bark-soft">JPG veya PNG, en fazla 8 MB</span>
              </label>
            )}
          </fieldset>

          {/* 2 — ölçüler */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold">2. Ölçüler</legend>
            <p className="text-sm leading-relaxed text-bark-soft">
              Santimetre cinsinden yazın. Emin değilseniz boş bırakabilir,
              aşağıya anlatabilirsiniz.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-bark-soft">Genişlik</span>
                <input name="width_cm" inputMode="decimal" placeholder="38" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-bark-soft">Derinlik</span>
                <input name="depth_cm" inputMode="decimal" placeholder="24" className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-bark-soft">Yükseklik</span>
                <input name="height_cm" inputMode="decimal" placeholder="18" className={field} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Renk tercihi</span>
              <input
                name="color"
                maxLength={80}
                placeholder="Doğal hasır, beyaz, gri…"
                className={field}
              />
            </label>
          </fieldset>

          {/* 3 — anlatın */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold">3. Nasıl bir sepet?</legend>
            <textarea
              name="description"
              required
              rows={5}
              minLength={10}
              maxLength={1500}
              placeholder="Kapaklı mı olsun, astarlı mı? Nerede kullanacaksınız? Aklınızdaki detayları yazın."
              className={`${field} resize-y`}
            />
          </fieldset>

          {/* 4 — iletişim */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold">4. Size nasıl ulaşalım?</legend>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Adınız soyadınız</span>
              <input name="name" required maxLength={160} autoComplete="name" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">E-posta</span>
              <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Telefon (isteğe bağlı)</span>
              <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} />
            </label>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-sm bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {state === "sending" ? "Gönderiliyor…" : "Talebi gönder"}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-bark-soft">
              Kart bilgisi istenmez. Fiyatı Eda belirledikten sonra karar verirsiniz.
            </p>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
