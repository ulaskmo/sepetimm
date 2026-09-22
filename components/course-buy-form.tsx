"use client";

import { useState } from "react";

export function CourseBuyForm({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/kurs/satin-al", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          name: form.get("name"),
          email: form.get("email"),
        }),
      });
      const data = (await res.json()) as { payPath?: string; error?: string };
      if (!res.ok || !data.payPath) throw new Error(data.error || "İşlem başlatılamadı.");
      window.location.href = data.payPath;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Adınız soyadınız</span>
        <input
          name="name"
          required
          maxLength={160}
          autoComplete="name"
          className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-rattan"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">E-posta</span>
        <input
          name="email"
          type="email"
          required
          maxLength={160}
          autoComplete="email"
          className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-rattan"
        />
        <span className="mt-1.5 block text-xs text-bark-soft">
          Kursa bu adresle giriş yapacaksınız.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Yönlendiriliyor…" : "Satın al"}
      </button>
    </form>
  );
}
