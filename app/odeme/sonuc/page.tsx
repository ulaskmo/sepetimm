import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ödeme sonucu", robots: { index: false } };

export default async function PaymentResultPage({ searchParams }: PageProps<"/odeme/sonuc">) {
  const { durum } = await searchParams;
  const ok = durum === "basarili";

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <span
        className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${
          ok ? "bg-sage/20" : "bg-red-500/10"
        }`}
      >
        {ok ? "OK" : "!"}
      </span>

      <h1 className="mt-7 font-display text-3xl font-semibold">
        {ok ? "Ödemeniz alındı" : "Ödeme tamamlanamadı"}
      </h1>

      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bark-soft">
        {ok
          ? "Teşekkürler! Onay e-postanız yolda. Eda siparişinizi hazırlamaya başlıyor."
          : "Kartınızdan herhangi bir tutar çekilmedi. Ödeme bağlantınız hâlâ geçerli, dilediğiniz zaman tekrar deneyebilirsiniz."}
      </p>

      <Link
        href={ok ? "/urunler" : "/"}
        className="mt-9 inline-flex rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg"
      >
        {ok ? "Diğer sepetlere bak" : "Ana sayfaya dön"}
      </Link>
    </div>
  );
}
