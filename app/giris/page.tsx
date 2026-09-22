import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Satın aldığınız kurslara erişmek için e-posta ile giriş yapın.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Giriş yap</h1>
      <p className="mt-4 text-sm leading-relaxed text-bark-soft">
        Şifre yok. E-posta adresinizi yazın, size tek kullanımlık bir giriş bağlantısı
        gönderelim.
      </p>
      <LoginForm />
    </div>
  );
}
