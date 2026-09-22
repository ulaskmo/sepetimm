import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion-primitives";
import { listCourses } from "@/lib/queries";
import { formatTRY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Video Kurslar",
  description:
    "Kağıt çubuk sarmaktan kenar kapatmaya, sepet örmenin her adımını anlatan 5-10 dakikalık video kurslar.",
};

const LEVEL: Record<string, string> = {
  baslangic: "Başlangıç",
  orta: "Orta",
  ileri: "İleri",
};

export default async function CoursesPage() {
  const courses = await listCourses();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Video kurslar</p>
        <h1 className="mt-4 max-w-2xl font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05]">
          Kendi sepetinizi örmeyi öğrenin
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-bark-soft">
          Her kurs 5-10 dakikalık, tek bir tekniği baştan sona gösteren kısa bir video.
          Satın aldığınız kurslar hesabınızda süresiz kalır, istediğiniz kadar izlersiniz.
        </p>
      </Reveal>

      {courses.length > 0 ? (
        <Stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <StaggerItem key={c.id}>
              <Link
                href={`/kurslar/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-raised transition-transform hover:-translate-y-2"
              >
                <div className="relative aspect-video overflow-hidden bg-sand">
                  {c.cover_image ? (
                    <Image
                      src={c.cover_image}
                      alt={c.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-4xl opacity-40">▶</div>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {c.duration_sec ? `${Math.round(c.duration_sec / 60)} dk` : "5-10 dk"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[11px] uppercase tracking-wider text-bark-soft">
                    {LEVEL[c.level] ?? c.level}
                  </span>
                  <h2 className="mt-2 font-display text-lg font-semibold leading-snug">{c.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-bark-soft">
                    {c.description}
                  </p>
                  <p className="mt-5 text-base font-semibold">{formatTRY(c.price_kurus)}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="mt-14 rounded-3xl border border-dashed border-line bg-raised/60 p-12 text-center">
          <p className="font-display text-xl font-semibold">Kurslar hazırlanıyor</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bark-soft">
            İlk video kurslar çok yakında burada olacak.
          </p>
        </Reveal>
      )}
    </div>
  );
}
