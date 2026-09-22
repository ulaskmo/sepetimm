import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Satın aldığınız kurslara erişmek için giriş yapın.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const { devam } = await searchParams;
  const next = Array.isArray(devam) ? devam[0] : devam;

  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Giriş yap</h1>
      <p className="mt-4 text-sm leading-relaxed text-bark-soft">
        Kurslarınız hesabınızda süresiz duruyor. E-posta ve şifrenizle girin.
      </p>
      <LoginForm next={next} />
    </div>
  );
}
