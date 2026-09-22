"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const field =
  "w-full rounded-sm border border-hair bg-bg px-4 py-3 text-sm outline-none transition-colors focus:border-rattan";

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-sm bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/kayit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Hesap oluşturulamadı.");
      router.push(next || "/hesabim");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Adınız soyadınız</span>
        <input name="name" required maxLength={160} autoComplete="name" className={field} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">E-posta</span>
        <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Şifre</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={field}
        />
        <span className="mt-1.5 block text-xs text-bark-soft">En az 8 karakter.</span>
      </label>

      {error && <FormError message={error} />}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Oluşturuluyor…" : "Hesap oluştur"}
      </button>

      <p className="text-center text-sm text-bark-soft">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-semibold text-rattan-deep">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const endpoint = mode === "password" ? "/api/giris/sifre" : "/api/giris";
    const payload =
      mode === "password"
        ? { email: form.get("email"), password: form.get("password") }
        : { email: form.get("email") };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Giriş yapılamadı.");

      if (mode === "magic") {
        setMagicSent(true);
        setBusy(false);
        return;
      }
      router.push(next || "/hesabim");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {magicSent ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-none border border-hair bg-raised p-7 text-center"
        >
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage/20 text-sage">
            <svg viewBox="0 0 20 16" width="20" height="16" aria-hidden="true" fill="none">
              <rect x="1" y="1" width="18" height="14" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.5 2 10 9l8.5-7" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <p className="mt-5 font-display text-lg font-semibold">E-postanızı kontrol edin</p>
          <p className="mt-2 text-sm leading-relaxed text-bark-soft">
            Giriş bağlantınızı gönderdik. 20 dakika geçerli ve tek kullanımlık.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-posta</span>
            <input name="email" type="email" required maxLength={160} autoComplete="email" className={field} />
          </label>

          {mode === "password" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Şifre</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={field}
              />
            </label>
          )}

          {error && <FormError message={error} />}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy
              ? "Gönderiliyor…"
              : mode === "password"
                ? "Giriş yap"
                : "Giriş bağlantısı gönder"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "password" ? "magic" : "password");
              setError("");
            }}
            className="w-full text-center text-sm text-bark-soft underline hover:text-rattan-deep"
          >
            {mode === "password"
              ? "Şifremi unuttum — e-posta ile giriş yap"
              : "Şifremle giriş yapmak istiyorum"}
          </button>

          <p className="text-center text-sm text-bark-soft">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-semibold text-rattan-deep">
              Hesap oluşturun
            </Link>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
