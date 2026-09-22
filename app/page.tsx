import Link from "next/link";
import { HeroVideo } from "@/components/hero-video";
import { ScrollAssembly } from "@/components/scroll-assembly";
import { WordsUp } from "@/components/motion-primitives";
import { ProductCard } from "@/components/product-card";
import { Reveal, Stagger, StaggerItem, WeaveDivider } from "@/components/motion-primitives";
import { featuredProducts, listCourses } from "@/lib/queries";
import { BRAND } from "@/lib/brand";

const STEPS = [
  {
    n: "01",
    title: "Kağıt toplanır",
    body: "Gazete ve dergi sayfaları ayrılır, ince şeritler halinde kesilir. Çöpe gidecek kağıt, hammaddeye dönüşür.",
  },
  {
    n: "02",
    title: "Çubuk sarılır",
    body: "Her şerit şişle tek tek sarılarak çubuk haline getirilir. Bir sepet için yüzlerce çubuk gerekir.",
  },
  {
    n: "03",
    title: "Boyanır ve kurutulur",
    body: "Çubuklar su bazlı boyayla renklendirilir, doğal hasır tonunu almaları için kurumaya bırakılır.",
  },
  {
    n: "04",
    title: "Elde örülür",
    body: "Tabandan başlayıp kenar kapatmaya kadar tamamı elde örülür. Astar ve dantel en son dikilir.",
  },
];

const RESERVATION_STEPS = [
  { title: "Talep gönderirsiniz", body: "Beğendiğiniz sepet için formu doldurursunuz. Kart bilgisi istenmez." },
  { title: "Eda değerlendirir", body: "Talep anında Eda'ya ulaşır. Sepetin müsaitliğine göre onaylar ya da reddeder." },
  { title: "Onaylanırsa ödersiniz", body: "Sadece onay çıkarsa size ödeme bağlantısı e-postayla gelir. Reddedilirse hiçbir ücret alınmaz." },
];

export default async function HomePage() {
  const [products, courses] = await Promise.all([featuredProducts(3), listCourses()]);

  return (
    <>
      {/* Kısa giriş — asıl gösteri aşağıdaki kaydırmalı örgü bölümünde */}
      <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 md:pb-14 md:pt-24">
        <p className="rise-in mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-raised/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-bark-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          {BRAND.city}&apos;dan el emeği
        </p>

        <h1 className="font-display text-[clamp(2.2rem,6vw,3.8rem)] font-semibold leading-[1.05] tracking-tight">
          <WordsUp text="Tek tek elde örülen" />
          <br />
          <span className="italic text-rattan-deep">
            <WordsUp text="sepetler ve çantalar" />
          </span>
        </h1>

        <p
          style={{ animationDelay: "0.5s" }}
          className="rise-in mx-auto mt-6 max-w-md text-base leading-relaxed text-bark-soft sm:text-lg"
        >
          Geri dönüşümlü kağıt çubuk, ip ve rafya — hepsi saatler süren bir sabırla,
          elde örülür. Makine yok, kalıp yok; her parça elden çıkar.
        </p>
      </section>

      {/* Kaydırdıkça sepet sıra sıra örülür */}
      <ScrollAssembly src="/urunler/sepet-hero.jpg" />

      {/* Süreç */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Kağıt sepetler nasıl yapılıyor</p>
          <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight">
            Bir gazete sayfasından sepete giden yol
          </h2>
        </Reveal>

        <WeaveDivider className="my-12" />

        <Stagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StaggerItem key={step.n}>
              <p className="font-display text-3xl font-semibold text-rattan">{step.n}</p>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bark-soft">{step.body}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-14">
          <HeroVideo
            src="/video/orgu-detay.mp4"
            poster="/video/orgu-detay-poster.jpg"
            label="Ellerin kağıt şeritleri örerek sepet dokusu oluşturması"
            className="aspect-video w-full rounded-[1.75rem] shadow-[var(--shadow)]"
          />
        </Reveal>
      </section>

      {/* Öne çıkan sepetler */}
      <section className="bg-sand/45 weave-texture py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Koleksiyon</p>
              <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight">
                Şu an müsait olanlar
              </h2>
            </div>
            <Link
              href="/urunler"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-rattan-deep"
            >
              Hepsini gör
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>

          <Reveal className="mt-10">
            <HeroVideo
              src="/video/annem-sepet.mp4"
              poster="/video/annem-sepet-poster.jpg"
              label="Çiçek işlemeli el örgüsü çanta, her açıdan"
              className="aspect-video w-full rounded-[1.75rem] shadow-[var(--shadow)]"
            />
          </Reveal>

          {products.length > 0 ? (
            <Stagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} priority={i === 0} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <Reveal className="mt-12 rounded-3xl border border-dashed border-line bg-raised/60 p-10 text-center">
              <p className="text-bark-soft">
                Koleksiyon hazırlanıyor. Yeni sepetler için{" "}
                <a className="font-semibold text-rattan-deep" href={BRAND.instagram}>
                  @{BRAND.handle}
                </a>{" "}
                hesabını takip edin.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* Rezervasyon nasıl işler */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Rezervasyon</p>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight">
            Önce onay, sonra ödeme
          </h2>
          <p className="mt-5 text-base leading-relaxed text-bark-soft">
            Sepetler tek tek üretildiği için doğrudan satın alma yok. Önce talebinizi
            iletirsiniz — kartınızdan hiçbir şey çekilmez.
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {RESERVATION_STEPS.map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="h-full rounded-3xl border border-line bg-raised p-7">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sand font-display text-sm font-semibold">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bark-soft">{s.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Kurslar */}
      <section className="bg-bark py-20 text-bg md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-bg/55">Video kurslar</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold leading-tight">
              Kendi sepetinizi örün
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-bg/70">
              5-10 dakikalık, adım adım anlatan kısa videolar. Çubuk sarmaktan kenar
              kapatmaya kadar her tekniği kendi hızınızda öğrenin. Satın aldığınız
              kurslar hesabınızda sınırsız süre kalır.
            </p>
            <Link
              href="/kurslar"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-bg px-7 py-3.5 text-sm font-semibold text-bark transition-transform hover:-translate-y-0.5"
            >
              Kurslara bak
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </Reveal>

          <Reveal delay={0.15}>
            <ul className="space-y-3">
              {(courses.length > 0
                ? courses.slice(0, 4).map((c) => c.title)
                : [
                    "Kağıt çubuk sarma tekniği",
                    "Sepet tabanı örme",
                    "Düz örgü ve zikzak desen",
                    "Kenar kapatma ve astar dikimi",
                  ]
              ).map((title, i) => (
                <li
                  key={title}
                  className="flex items-center gap-4 rounded-2xl border border-bg/12 bg-bg/6 px-5 py-4"
                >
                  <span className="font-display text-sm text-bg/45">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{title}</span>
                  <span className="ml-auto text-xs text-bg/45">5-10 dk</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
