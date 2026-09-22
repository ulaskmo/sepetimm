import crypto from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { sql } from "@/lib/db";
import { startSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş doğrulanıyor", robots: { index: false } };

export default async function VerifyPage({ searchParams }: PageProps<"/giris/dogrula">) {
  const { token } = await searchParams;
  const raw = Array.isArray(token) ? token[0] : token;

  if (raw) {
    const hash = crypto.createHash("sha256").update(raw).digest("hex");

    // `used_at is null` in the WHERE is what makes the link single-use: a
    // second click updates nothing.
    const rows = (await sql`
      update login_tokens set used_at = now()
      where token = ${hash} and used_at is null and expires_at > now()
      returning email
    `) as unknown as { email: string }[];

    if (rows[0]) {
      await startSession(rows[0].email);
      redirect("/hesabim");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Bağlantı geçersiz</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bark-soft">
        Bu giriş bağlantısının süresi dolmuş ya da daha önce kullanılmış. Yeni bir
        bağlantı isteyebilirsiniz.
      </p>
      <Link
        href="/giris"
        className="mt-8 inline-flex rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg"
      >
        Yeni bağlantı gönder
      </Link>
    </div>
  );
}
