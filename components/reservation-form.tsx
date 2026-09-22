"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatTRY } from "@/lib/brand";

type State = "idle" | "sending" | "sent" | "error";

export function ReservationForm({
  productSlug,
  productTitle,
  priceKurus,
}: {
  productSlug: string;
  productTitle: string;
  priceKurus: number;
}) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/rezervasyon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: productSlug,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          note: form.get("note"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Talep gönderilemedi.");
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <div className="rounded-none border border-hair bg-raised p-7 shadow-[var(--shadow)]">
      <AnimatePresence mode="wait" initial={false}>
        {state === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="py-4 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage/20 text-sage"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none"><path d="M2 8.5 6 12.5 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.span>
            <p className="mt-5 font-display text-xl font-semibold">Talebiniz iletildi</p>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-bark-soft">
              Talebiniz onaylanırsa ödeme bağlantısını WhatsApp’tan göndereceğiz.
              Şu an hiçbir ödeme alınmadı.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <p className="font-display text-lg font-semibold">Rezervasyon talebi</p>
              <p className="mt-1.5 text-sm leading-relaxed text-bark-soft">
                {formatTRY(priceKurus)} · Ödeme yalnızca talebiniz onaylanırsa alınır.
                Şimdi kart bilgisi istenmez.
              </p>
            </div>

            <Field name="name" label="Adınız soyadınız" autoComplete="name" required />
            <Field name="email" label="E-posta" type="email" autoComplete="email" required />
            <Field
              name="phone"
              label="Cep telefonu (WhatsApp)"
              type="tel"
              autoComplete="tel"
              required
              placeholder="0555 111 22 33"
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Not (isteğe bağlı)</span>
              <textarea
                name="note"
                rows={3}
                maxLength={600}
                placeholder={`${productTitle} hakkında merak ettikleriniz, renk tercihiniz...`}
                className="w-full resize-none rounded-sm border border-hair bg-bg px-4 py-3 text-sm outline-none transition-colors placeholder:text-bark-soft/55 focus:border-rattan"
              />
            </label>

            {state === "error" && (
              <p role="alert" className="rounded-sm bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {state === "sending" ? "Gönderiliyor…" : "Talep gönder"}
            </button>

            <p className="text-center text-xs leading-relaxed text-bark-soft">
              Talep göndermek sizi ödemeye mecbur bırakmaz.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={160}
        className="w-full rounded-sm border border-hair bg-bg px-4 py-3 text-sm outline-none transition-colors focus:border-rattan"
      />
    </label>
  );
}
