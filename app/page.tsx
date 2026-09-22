import Image from "next/image";
import Link from "next/link";
import { HeroVideo } from "@/components/hero-video";
import { ProductCard } from "@/components/product-card";
import { featuredProducts, listCourses } from "@/lib/queries";
import { BRAND, formatTRY } from "@/lib/brand";

const FACTS = [
  ["Üretim", "Tamamı elde tek tek örülür"],
  ["Malzeme", "%100 Geri dönüşümlü kağıt"],
  ["Ödeme", "Onay çıkmadan ödeme alınmaz"],
  ["Kurslar", "Adım adım video dersler"],
];

const STEPS = [
  ["01", "Kağıt ayrılır", "Gazete ve dergi sayfaları ince şeritler halinde kesilir."],
  ["02", "Çubuk sarılır", "Şeritler şişle tek tek sarılarak dayanıklı çubuklara dönüşür."],
  ["03", "Boyanır", "Su bazlı boyayla renklendirilir, kurumaya bırakılır."],
  ["04", "Örülür", "Tabandan kenara elde dokunur. Astar ve taban dikişle eklenir."],
];

const RESERVATION = [
  ["01", "Talep", "Beğendiğiniz ürün için formu doldurun. Kart bilgisi istenmez."],
  ["02", "Değerlendirme", "Talep bize ulaşır; atölye müsaitliğine göre onaylarız."],
  ["03", "Ödeme", "Yalnızca onay çıkarsa ödeme bağlantısı e-posta ile gelir."],
];

export default async function HomePage() {
  const [products, courses] = await Promise.all([featuredProducts(4), listCourses()]);

  return (
    <div className="space-y-20 pb-12 md:space-y-28 md:pb-20">
      {/* 1. HERO — sepet arka planda, metin üstünde, telefonda tek ekran */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-start overflow-hidden pt-5 md:items-center md:pt-0">
        {/* Arka plan sepeti. Kesilmiş PNG, beyaz fon yok — sayfanın kendi
            rengi görünüyor. Telefonda alta, geniş ekranda sağa yaslanıyor. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[56%]"
        >
          <Image
            src="/urunler/oval-kapakli-sepet.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 56vw"
            className="object-contain object-bottom md:object-right md:object-contain"
          />
        </div>

        {/* Metnin okunabilirliği için sepetin üzerine ince bir perde. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/40 via-bg/85 to-bg md:bg-gradient-to-r md:from-bg md:via-bg/80 md:to-transparent"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-2 sm:px-6 md:py-14">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">
              Atölye · El Örgüsü
            </p>

            <h1 className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight">
              Bir sepet,
              <br />
              yüzlerce
              <br />
              kağıt çubuk.
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-bark-soft">
              Biz her parçayı geri dönüşümlü kağıt çubuklarla tek tek elde örüyoruz.
              Kalıp yok, fabrika yok. Onay çıkmadan kimseden ödeme almıyoruz.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/urunler"
                className="rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
              >
                Sepetlere bak
              </Link>
              <Link
                href="/kurslar"
                className="rounded-sm border border-hair px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-sand"
              >
                Video kurslar
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/ozel-siparis"
                className="border-b border-bark/30 pb-0.5 text-sm text-bark-soft transition-colors hover:border-bark hover:text-bark"
              >
                Özel sipariş ver →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. KÜNYE ŞERİDİ */}
      <section className="border-y border-hair bg-raised/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 divide-y divide-hair sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {FACTS.map(([label, value]) => (
              <div key={label} className="py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                <dt className="text-xs uppercase tracking-[0.2em] text-bark-soft">{label}</dt>
                <dd className="mt-2 text-sm font-medium leading-snug text-bark">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3. HER AÇIDAN — VİDEO BÖLÜMÜ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Her açıdan</p>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-tight">
              Fotoğrafın göstermediği detaylar
            </h2>
            <p className="mt-4 text-base leading-relaxed text-bark-soft">
              File örgü gövde, elde işlenmiş çiçek motifleri, kumaş astar ve metal ayaklı
              hakiki deri taban.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="overflow-hidden border border-hair bg-sand shadow-[var(--shadow)]">
              <HeroVideo
                src="/video/annem-sepet.mp4"
                poster="/video/annem-sepet-poster.jpg"
                label="Çiçek işlemeli el örgüsü çanta, dönen platformda"
                className="aspect-video w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. ŞU AN MÜSAİT (ÜRÜNLER) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between border-b border-hair pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Koleksiyon</p>
            <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-tight">
              Şu an müsait parçalar
            </h2>
          </div>
          <Link
            href="/urunler"
            className="border-b border-bark/30 pb-0.5 text-sm transition-colors hover:border-bark"
          >
            Tümünü gör →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-8 lg:grid-cols-4">
            {products.map((p, i) => (
              <div key={p.id}>
                <ProductCard product={p} priority={i < 2} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 border border-dashed border-hair p-12 text-center">
            <p className="text-sm text-bark-soft">
              Yeni parçalar örülüyor. Güncel üretimi{" "}
              <a
                className="border-b border-bark/30 pb-0.5 font-medium text-bark"
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{BRAND.handle}
              </a>{" "}
              üzerinden takip edebilirsiniz.
            </p>
          </div>
        )}
      </section>

      {/* 5. SÜREÇ — Kısa ve Net */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-b border-hair pb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Süreç</p>
          <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.4rem)] font-semibold leading-tight">
            Gazete sayfasından sepete
          </h2>
        </div>

        <div className="mt-6 divide-y divide-hair">
          {STEPS.map(([num, title, body]) => (
            <div key={num} className="grid grid-cols-12 gap-4 py-5">
              <span className="col-span-2 font-mono text-sm font-semibold text-rattan-deep sm:col-span-1">
                {num}
              </span>
              <h3 className="col-span-10 text-base font-semibold sm:col-span-3">{title}</h3>
              <p className="col-start-3 col-end-13 text-sm leading-relaxed text-bark-soft sm:col-span-8 sm:col-start-5">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. REZERVASYON — Önce Onay, Sonra Ödeme */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border border-hair bg-raised p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Nasıl alınır</p>
              <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.2rem)] font-semibold leading-tight">
                Önce onay,
                <br />
                sonra ödeme.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-bark-soft">
                Her parça tek tek üretildiği için doğrudan ödeme alınmaz. Talebiniz onaylanmadan
                kartınızdan hiçbir şey çekilmez.
              </p>
            </div>

            <div className="md:col-span-7">
              <div className="divide-y divide-hair border-t border-hair">
                {RESERVATION.map(([step, title, body]) => (
                  <div key={step} className="flex gap-5 py-4">
                    <span className="font-mono text-xs font-semibold text-rattan-deep">
                      {step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-bark">{title}</h3>
                      <p className="mt-1 text-sm text-bark-soft">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VİDEO KURSLAR — Kendin Ör */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-none border border-hair bg-sand/35 p-8 sm:p-12">
          <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Video kurslar</p>
              <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.2rem)] font-semibold leading-tight">
                Kendi sepetinizi örün
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-bark-soft">
                5–10 dakikalık, tek bir tekniği baştan sona anlatan dersler. Satın alınca
                hesabınızda süresiz kalır.
              </p>
              <div className="mt-6">
                <Link
                  href="/kurslar"
                  className="inline-block rounded-sm bg-bark px-7 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
                >
                  Kurslara bak
                </Link>
              </div>
            </div>

            <div className="md:col-span-7">
              <ul className="divide-y divide-hair border-y border-hair bg-raised/70">
                {(courses.length > 0
                  ? courses.slice(0, 4).map((c) => [c.title, formatTRY(c.price_kurus)] as const)
                  : ([
                      ["Kağıt çubuk sarma tekniği", "—"],
                      ["Sepet tabanı örme ve kilit deseni", "—"],
                      ["Düz örgü ve zikzak desen", "—"],
                      ["Kenar kapatma ve astar dikimi", "—"],
                    ] as const)
                ).map(([title, price], i) => (
                  <li
                    key={title}
                    className="flex items-baseline justify-between gap-4 p-4 text-sm"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-bark-soft/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium text-bark">{title}</span>
                    </div>
                    <span className="shrink-0 font-medium text-bark-soft">{price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
