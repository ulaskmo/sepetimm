import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion-primitives";
import { CourseBuyForm } from "@/components/course-buy-form";
import { getCourse, ownsCourse } from "@/lib/queries";
import { currentEmail } from "@/lib/auth";
import { formatTRY } from "@/lib/brand";

export async function generateMetadata({ params }: PageProps<"/kurslar/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Kurs bulunamadı" };
  return { title: course.title, description: course.description.slice(0, 160) };
}

export default async function CoursePage({ params }: PageProps<"/kurslar/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const email = await currentEmail();
  const owned = email ? await ownsCourse(email, course.id) : false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-20">
      <Link href="/kurslar" className="text-sm text-bark-soft hover:text-rattan-deep">
        ← Tüm kurslar
      </Link>

      <Reveal className="mt-8">
        <div className="relative aspect-video overflow-hidden rounded-[1.75rem] bg-sand shadow-[var(--shadow)]">
          {course.cover_image ? (
            <Image
              src={course.cover_image}
              alt={course.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-5xl opacity-30">▶</div>
          )}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.6fr_1fr] md:gap-14">
        <Reveal>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.08]">
            {course.title}
          </h1>
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-bark-soft">
            {course.description}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-line bg-raised p-7 shadow-[var(--shadow)] md:sticky md:top-28">
            {owned ? (
              <>
                <p className="font-display text-lg font-semibold">Bu kurs sizde</p>
                <p className="mt-2 text-sm leading-relaxed text-bark-soft">
                  Hesabınızdan istediğiniz zaman izleyebilirsiniz.
                </p>
                <Link
                  href="/hesabim"
                  className="mt-6 block rounded-full bg-bark px-6 py-4 text-center text-sm font-semibold text-bg"
                >
                  Kursu izle
                </Link>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold">{formatTRY(course.price_kurus)}</p>
                <p className="mt-2 text-sm leading-relaxed text-bark-soft">
                  Tek seferlik ödeme, süresiz erişim. Ödeme sonrası e-postanıza giriş
                  bağlantısı gelir.
                </p>
                <CourseBuyForm slug={course.slug} signedIn={Boolean(email)} />
              </>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
