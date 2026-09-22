import Link from "next/link";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Mağaza",
    links: [
      ["Ürünler", "/urunler"],
      ["Özel sipariş", "/ozel-siparis"],
      ["Video kurslar", "/kurslar"],
    ],
  },
  {
    title: "Hakkında",
    links: [
      ["Hikaye", "/hikaye"],
      ["Hesabım", "/hesabim"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-5">
          <p className="font-display text-[1.35rem] font-semibold tracking-tight">{BRAND.name}</p>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-bark-soft">
            {BRAND.tagline}. Her parçayı {BRAND.city}&apos;da tek tek
            elimizle örüyoruz.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className="lg:col-span-2" aria-label={col.title}>
            <p className="text-[10px] uppercase tracking-[0.24em] text-bark-soft">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link className="text-[14px] text-bark-soft transition-colors hover:text-bark" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-bark-soft">İletişim</p>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <a
                className="text-bark-soft transition-colors hover:text-bark"
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{BRAND.handle}
              </a>
            </li>
            <li className="text-bark-soft">{BRAND.city}, Türkiye</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hair">
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-2 px-5 py-5 text-[12px] text-bark-soft lg:px-10">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span>{BRAND.city}</span>
        </div>
      </div>
    </footer>
  );
}
