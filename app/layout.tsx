import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BRAND } from "@/lib/brand";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — El Yapımı Geri Dönüşümlü Kağıt Sepetler`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Giresun'dan, geri dönüşümlü kağıt çubuklarla tek tek elde örülen sepetler. Her parça size özel hazırlanır. Ayrıca kendi sepetinizi örmeyi öğreten video kurslar.",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: BRAND.name,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-bark">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
