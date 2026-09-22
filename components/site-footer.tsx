import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/40 weave-texture">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">{BRAND.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-bark-soft">
            {BRAND.tagline}. Her sepet {BRAND.city}&apos;da, tek tek elde örülür.
          </p>
        </div>

        <nav aria-label="Alt menü">
          <p className="text-xs uppercase tracking-[0.18em] text-bark-soft">Keşfet</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:text-rattan-deep" href="/urunler">Sepetler</Link></li>
            <li><Link className="hover:text-rattan-deep" href="/ozel-siparis">Özel sipariş</Link></li>
            <li><Link className="hover:text-rattan-deep" href="/kurslar">Video kurslar</Link></li>
            <li><Link className="hover:text-rattan-deep" href="/hikaye">Hikayemiz</Link></li>
            <li><Link className="hover:text-rattan-deep" href="/hesabim">Hesabım</Link></li>
          </ul>
        </nav>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-bark-soft">İletişim</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a className="hover:text-rattan-deep" href={BRAND.instagram} target="_blank" rel="noopener noreferrer">
                Instagram · @{BRAND.handle}
              </a>
            </li>
            <li className="text-bark-soft">{BRAND.city}, Türkiye</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-4 py-6 text-center text-xs text-bark-soft sm:px-6">
        © {new Date().getFullYear()} {BRAND.name}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
