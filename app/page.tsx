import Link from "next/link";
import { HeroVideo } from "@/components/hero-video";
import { ShardHero } from "@/components/shard-hero";
import { ProductCard } from "@/components/product-card";
import { featuredProducts, listCourses } from "@/lib/queries";
import { BRAND, formatTRY } from "@/lib/brand";

const FACTS = [
  ["Atölye", BRAND.city],
  ["Üretim", "Tamamı el işi"],
  ["Malzeme", "Geri dönüşümlü kağıt"],
  ["Adet", "Tek parça / siparişe özel"],
];

const STEPS = [
  ["01", "Kağıt toplanır", "Gazete ve dergi sayfaları ayrılır, ince şeritler halinde kesilir."],
  ["02", "Çubuk sarılır", "Her şerit şişle tek tek sarılır. Bir sepet yüzlerce çubuk ister."],
  ["03", "Boyanır", "Su bazlı boyayla renklendirilir, doğal tonunu alması için kurutulur."],
  ["04", "Örülür", "Tabandan kenar kapatmaya kadar elde. Astar ve dantel en son dikilir."],
];

const RESERVATION = [
  ["Talep", "Beğendiğiniz ürün için formu doldurursunuz. Kart bilgisi istenmez."],
  ["Değerlendirme", "Talep anında Eda'ya ulaşır; müsaitliğe göre onaylar ya da reddeder."],
  ["Ödeme", "Yalnızca onay çıkarsa ödeme bağlantısı e-postayla gelir."],
];

export default async function HomePage() {
  const [products, courses] = await Promise.all([featuredProducts(4), listCourses()]);

  return (
    <>
      <ShardHero
        fallbackSrc="/urunler/cicekli-canta-1.jpg"
        fallbackAlt="Çiçek işlemeli el örgüsü çanta"
      />

      {/* Künye şeridi */}
      <section className="border-b border-hair">
        <dl className="mx-auto grid max-w-[1400px] grid-cols-2 lg:grid-cols-4">
          {FACTS.map(([label, value], i) => (
            <div
              key={label}
              className={`px-5 py-6 lg:px-10 ${
                i % 2 === 1 ? "border-l border-hair" : ""
              } ${i > 1 ? "border-t border-hair lg:border-t-0" : ""} ${
                i === 2 ? "lg:border-l" : ""
              } lg:border-l lg:first:border-l-0`}
            >
              <dt className="text-[10px] uppercase tracking-[0.24em] text-bark-soft">{label}</dt>
              <dd className="mt-2 text-[14px]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Ürünler */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-10 lg:py-20">
          <div className="flex items-end justify-between gap-6 border-b border-hair pb-6">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-[-0.01em]">
              Şu an müsait
            </h2>
            <Link
              href="/urunler"
              className="shrink-0 border-b border-bark/30 pb-0.5 text-[13px] tracking-wide transition-colors hover:border-bark"
            >
              Tümü
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => (
                <div key={p.id}>
                  <ProductCard product={p} priority={i < 2} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-dashed border-hair px-6 py-16 text-center">
              <p className="text-[15px] text-bark-soft">
                Koleksiyon hazırlanıyor.{" "}
                <a className="border-b border-bark/30 pb-0.5" href={BRAND.instagram}>
                  @{BRAND.handle}
                </a>{" "}
                hesabından takip edebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Video */}
      <section className="border-b border-hair">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-12 lg:px-10 lg:py-20">
          <div className="lg:col-span-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-bark-soft">Her açıdan</p>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.01em]">
              Fotoğrafın göstermediği
              <br />
              detaylar
            </h2>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-bark-soft">
              File örgü gövde, elde işlenmiş çiçekler, kumaş astar ve metal ayaklı
              hakiki deri taban.
            </p>
          </div>
          <div className="lg:col-span-8">
            <HeroVideo
              src="/video/annem-sepet.mp4"
              poster="/video/annem-sepet-poster.jpg"
              label="Çiçek işlemeli el örgüsü çanta, dönen platformda"
              className="aspect-video w-full"
            />
          </div>
        </div>
      </section>

      {/* Süreç */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-[1400px] px-5 py-14 lg:px-10 lg:py-20">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-bark-soft">Süreç</p>
            <h2 className="mt-5 max-w-lg font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.01em]">
              Gazete sayfasından sepete
            </h2>
          </div>

          <div className="mt-12 border-t border-hair">
            {STEPS.map(([n, title, body]) => (
              <div key={n}>
                <div className="grid grid-cols-12 gap-4 border-b border-hair py-6">
                  <span className="col-span-2 font-display text-[13px] text-rattan-deep lg:col-span-1">
                    {n}
                  </span>
                  <h3 className="col-span-10 text-[15px] font-medium lg:col-span-3">{title}</h3>
                  <p className="col-start-3 col-end-13 text-[14px] leading-relaxed text-bark-soft lg:col-span-8 lg:col-start-5">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rezervasyon */}
      <section className="border-b border-hair">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-12 lg:px-10 lg:py-20">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-bark-soft">Nasıl alınır</p>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.01em]">
              Önce onay,
              <br />
              sonra ödeme
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-bark-soft">
              Her parça tek tek üretildiği için doğrudan satın alma yok. Talebiniz
              onaylanmazsa kartınızdan hiçbir şey çekilmez.
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="border-t border-hair">
              {RESERVATION.map(([title, body], i) => (
                <div key={title}>
                  <div className="flex gap-6 border-b border-hair py-5">
                    <span className="font-display text-[13px] text-rattan-deep">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-medium">{title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-bark-soft">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kurslar */}
      <section className="bg-bark text-bg">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 lg:grid-cols-12 lg:px-10 lg:py-24">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.26em] text-bg/50">Video kurslar</p>
            <h2 className="mt-5 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.01em]">
              Kendi sepetinizi örün
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-bg/65">
              5-10 dakikalık, tek bir tekniği baştan sona gösteren dersler. Satın aldığınız
              kurslar hesabınızda süresiz kalır.
            </p>
            <Link
              href="/kurslar"
              className="mt-9 inline-block rounded-sm bg-bg px-7 py-3.5 text-[13px] font-medium tracking-wide text-bark transition-opacity hover:opacity-85"
            >
              Kurslara bak
            </Link>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="border-t border-bg/15">
              {(courses.length > 0
                ? courses.slice(0, 4).map((c) => [c.title, formatTRY(c.price_kurus)] as const)
                : ([
                    ["Kağıt çubuk sarma tekniği", "—"],
                    ["Sepet tabanı örme", "—"],
                    ["Düz örgü ve zikzak desen", "—"],
                    ["Kenar kapatma ve astar dikimi", "—"],
                  ] as const)
              ).map(([title, price], i) => (
                <li
                  key={title}
                  className="flex items-baseline gap-5 border-b border-bg/15 py-4 text-[15px]"
                >
                  <span className="font-display text-[12px] text-bg/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{title}</span>
                  <span className="text-[13px] text-bg/55">{price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
