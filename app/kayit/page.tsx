import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Hesap oluştur",
  description: "Video kursları izlemek için ücretsiz hesap oluşturun.",
};

export default async function RegisterPage({ searchParams }: PageProps<"/kayit">) {
  const { devam } = await searchParams;
  const next = Array.isArray(devam) ? devam[0] : devam;

  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Hesap oluştur</h1>
      <p className="mt-4 text-sm leading-relaxed text-bark-soft">
        Kursları satın almak ve sonrasında istediğiniz zaman tekrar tekrar izlemek
        için bir hesaba ihtiyacınız var. Sadece adınız, e-postanız ve bir şifre.
      </p>
      <RegisterForm next={next} />
    </div>
  );
}
