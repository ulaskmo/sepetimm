"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function LoginForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    const email = new FormData(e.currentTarget).get("email");
    try {
      const res = await fetch("/api/giris", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Bağlantı gönderilemedi.");
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
          className="mt-8 rounded-3xl border border-line bg-raised p-7 text-center"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage/20 text-xl">
            ✉
          </span>
          <p className="mt-5 font-display text-lg font-semibold">E-postanızı kontrol edin</p>
          <p className="mt-2 text-sm leading-relaxed text-bark-soft">
            Giriş bağlantınızı gönderdik. Bağlantı 20 dakika geçerli ve tek kullanımlık.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-posta</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              maxLength={160}
              autoComplete="email"
              className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-rattan"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full rounded-full bg-bark px-6 py-4 text-sm font-semibold text-bg disabled:opacity-60"
          >
            {state === "sending" ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
