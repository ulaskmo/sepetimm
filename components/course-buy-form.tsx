"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Courses are tied to an account, not to an email typed at checkout — that is
 * what lets someone come back months later and watch again. So when nobody is
 * signed in, this offers the account instead of a purchase.
 */
export function CourseBuyForm({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = `/kurslar/${slug}`;

  if (!signedIn) {
    return (
      <div className="mt-6 space-y-3">
        <Link
          href={`/kayit?devam=${encodeURIComponent(next)}`}
          className="block rounded-full bg-bark px-6 py-4 text-center text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
        >
          Hesap oluştur ve satın al
        </Link>
        <Link
          href={`/giris?devam=${encodeURIComponent(next)}`}
          className="block rounded-full border border-line px-6 py-4 text-center text-sm font-semibold hover:bg-sand"
        >
          Zaten hesabım var
        </Link>
        <p className="text-center text-xs leading-relaxed text-bark-soft">
          Kurslar hesabınıza tanımlanır; istediğiniz zaman tekrar izleyebilirsiniz.
        </p>
      </div>
    );
  }

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/kurs/satin-al", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
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
    <div className="mt-6 space-y-3">
      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="w-full rounded-full bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? "Yönlendiriliyor…" : "Satın al"}
      </button>
      <p className="text-center text-xs leading-relaxed text-bark-soft">
        Ödeme sonrası kurs hesabınıza tanımlanır.
      </p>
    </div>
  );
}
