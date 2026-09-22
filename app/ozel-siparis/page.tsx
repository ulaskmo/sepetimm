import type { Metadata } from "next";
import { CustomOrderForm } from "@/components/custom-order-form";
import { Reveal } from "@/components/motion-primitives";

export const metadata: Metadata = {
  title: "Özel Sipariş",
  description:
    "Aklınızdaki sepeti tarif edin: görsel yükleyin, ölçüleri yazın, Eda sizin için örsün.",
};

const STEPS = [
  "Görselinizi ve ölçülerinizi gönderirsiniz",
  "Eda inceleyip size özel bir fiyat belirler",
  "Fiyatı beğenirseniz ödersiniz — beğenmezseniz hiçbir şey ödemezsiniz",
];

export default function CustomOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Özel sipariş</p>
        <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05]">
          Aklınızdaki sepeti örelim
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-bark-soft">
          Hazır modellerde aradığınızı bulamadıysanız, istediğiniz sepeti tarif edin.
          Bir görsel ve birkaç ölçü yeterli.
        </p>

        <ol className="mt-8 space-y-2.5">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-bark-soft">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand font-display text-xs font-semibold text-bark">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <CustomOrderForm />
      </Reveal>
    </div>
  );
}
