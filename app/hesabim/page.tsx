import type { Metadata } from "next";
import Link from "next/link";
import { currentEmail } from "@/lib/auth";
import { ownedCourses } from "@/lib/queries";
import { embedUrl } from "@/lib/bunny";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountPage() {
  const email = await currentEmail();

  if (!email) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Önce giriş yapın</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bark-soft">
          Kurslarınızı görmek için e-posta adresinizle giriş yapmanız gerekiyor.
        </p>
        <Link
          href="/giris"
          className="mt-8 inline-flex rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  const courses = await ownedCourses(email);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.9rem,4.5vw,3rem)] font-semibold">Kurslarım</h1>
          <p className="mt-2 text-sm text-bark-soft">{email}</p>
        </div>
        <Link href="/cikis" className="text-sm text-bark-soft underline hover:text-rattan-deep">
          Çıkış yap
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="mt-12 space-y-14">
          {courses.map((course) => {
            const src = course.bunny_video_id ? embedUrl(course.bunny_video_id) : null;
            return (
              <div key={course.id}>
                <h2 className="font-display text-xl font-semibold">{course.title}</h2>
                <div className="mt-4 overflow-hidden rounded-none border border-hair bg-black">
                  {src ? (
                    <div className="relative aspect-video">
                      <iframe
                        src={src}
                        title={course.title}
                        loading="lazy"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                  ) : (
                    <div className="grid aspect-video place-items-center text-sm text-white/60">
                      Video yakında yüklenecek.
                    </div>
                  )}
                </div>
                {course.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-bark-soft">
                    {course.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-12 rounded-none border border-dashed border-hair bg-raised/60 p-12 text-center">
          <p className="font-display text-xl font-semibold">Henüz kursunuz yok</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bark-soft">
            Satın aldığınız kurslar burada görünür.
          </p>
          <Link
            href="/kurslar"
            className="mt-7 inline-flex rounded-sm bg-bark px-7 py-3.5 text-sm font-semibold text-bg"
          >
            Kurslara bak
          </Link>
        </div>
      )}
    </div>
  );
}
