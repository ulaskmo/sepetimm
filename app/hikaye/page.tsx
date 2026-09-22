import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Hikayemiz",
  description:
    "Giresun'da, atılacak kağıtlardan sepet ören bir atölyenin hikayesi. Geri dönüşümlü kağıt çubuk tekniği ve el emeği üretim.",
};

export default function StoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Hikayemiz</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05]">
          Çöpe giden kağıt, eve giren sepet
        </h1>
      </div>

      <div className="mt-10">
        <div className="relative aspect-4/3 overflow-hidden rounded-none shadow-[var(--shadow)]">
          <Image
            src="/urunler/hasir-oval-sepet.jpg"
            alt="Kapaklı oval hasır sepet"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      </div>

      <hr className="my-14 border-0 border-t border-hair" />

      <div className="space-y-6 text-base leading-relaxed text-bark-soft">
        <p>
          {BRAND.city}&apos;da başlayan küçük bir merak bu. Eskiden çöpe attığımız
          gazete ve dergi sayfalarının, doğru sarıldığında hasır kadar sağlam bir
          malzemeye dönüştüğünü keşfetmekle başladı.
        </p>
        <p>
          Her sepet aynı yolu izliyor: kağıt ince şeritler halinde kesiliyor, tek tek
          şişe sarılarak çubuk haline getiriliyor, su bazlı boyayla renklendirilip
          kurumaya bırakılıyor. Sonra tabandan başlayıp kenar kapatmaya kadar tamamı
          elde örülüyor. Astar ve dantel en son, dikiş makinesinde ekleniyor.
        </p>
        <p>
          Bir sepet için yüzlerce çubuk ve günlere yayılan bir sabır gerekiyor. Bu
          yüzden stok tutmuyoruz — her parça ya tek, ya da sizin için baştan örülüyor.
          Talebinizi onaylamadan sizden ödeme istememizin sebebi de bu: önce o sepetin
          gerçekten sizin olabileceğinden emin olmak istiyoruz.
        </p>
        <p>
          Her sepetin altındaki küçük deri marka, işin elden çıktığının imzası.
          Üzerinde <strong className="text-bark">@{BRAND.handle}</strong> yazıyor.
        </p>
      </div>

      <hr className="my-14 border-0 border-t border-hair" />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/urunler"
          className="rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg"
        >
          Sepetlere bak
        </Link>
        <a
          href={BRAND.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-hair px-7 py-3.5 text-sm font-semibold hover:bg-sand"
        >
          Instagram&apos;da takip et
        </a>
      </div>
    </div>
  );
}
