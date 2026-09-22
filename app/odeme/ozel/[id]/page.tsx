import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { buildPayForm, orderId, PRODUCT_TYPE } from "@/lib/shopier";
import { formatTRY } from "@/lib/brand";

export const metadata: Metadata = { title: "Özel sipariş ödemesi", robots: { index: false } };

type Row = {
  public_id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  status: string;
  price_kurus: number | null;
  pay_expires_at: string | null;
  width_cm: string | null;
  depth_cm: string | null;
  height_cm: string | null;
};

export default async function CustomPayPage({ params }: PageProps<"/odeme/ozel/[id]">) {
  const { id } = await params;

  let row: Row | undefined;
  try {
    const rows = (await sql`
      select public_id, name, email, phone, description, status, price_kurus,
             pay_expires_at, width_cm, depth_cm, height_cm
      from custom_requests where public_id = ${id} limit 1
    `) as unknown as Row[];
    row = rows[0];
  } catch {
    return <Notice title="Sayfa açılamadı" body="Lütfen birazdan tekrar deneyin." />;
  }

  if (!row) return <Notice title="Bu bağlantı geçersiz" body="Bağlantıyı e-postanızdan kontrol edin." />;

  if (row.status === "paid") {
    return (
      <Notice
        title="Bu sipariş zaten ödendi"
        body="Teşekkürler! Eda sepetinizi örmeye başladı, hazır olduğunda size yazacağız."
      />
    );
  }

  if (row.status !== "accepted" || row.price_kurus === null) {
    return (
      <Notice
        title="Bu talep henüz ödemeye açık değil"
        body="Eda talebinizi değerlendirip fiyat belirlediğinde size e-posta göndereceğiz."
      />
    );
  }

  if (row.pay_expires_at && new Date(row.pay_expires_at) < new Date()) {
    return (
      <Notice
        title="Teklifin süresi doldu"
        body="Bu fiyat teklifi artık geçerli değil. Hâlâ istiyorsanız yeni bir özel sipariş talebi gönderin."
        href="/ozel-siparis"
        cta="Yeni talep gönder"
      />
    );
  }

  const size = [row.width_cm, row.depth_cm, row.height_cm].every((v) => v === null)
    ? null
    : `${row.width_cm ?? "?"} × ${row.depth_cm ?? "?"} × ${row.height_cm ?? "?"} cm`;

  const [name, ...rest] = row.name.trim().split(/\s+/);
  const form = buildPayForm({
    orderId: orderId.forCustom(row.public_id),
    productName: `Özel sepet siparişi${size ? ` (${size})` : ""}`,
    productType: PRODUCT_TYPE.physical,
    priceKurus: row.price_kurus,
    buyer: { name, surname: rest.join(" ") || name, email: row.email, phone: row.phone },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-line bg-raised p-8 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Özel sipariş</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Fiyat teklifiniz hazır</h1>

        <p className="mt-5 whitespace-pre-line rounded-2xl bg-sand/60 p-4 text-sm leading-relaxed text-bark-soft">
          {row.description}
        </p>

        <dl className="mt-6 space-y-3 text-sm">
          {size && (
            <div className="flex justify-between gap-4">
              <dt className="text-bark-soft">Ölçüler</dt>
              <dd className="font-medium">{size}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-bark-soft">Alıcı</dt>
            <dd className="font-medium">{row.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-3">
            <dt className="text-bark-soft">Toplam</dt>
            <dd className="text-lg font-semibold">{formatTRY(row.price_kurus)}</dd>
          </div>
        </dl>

        <form action={form.action} method="post" className="mt-8">
          {Object.entries(form.fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <button
            type="submit"
            className="w-full rounded-full bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            Shopier ile güvenli öde
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-bark-soft">
          Teklifi kabul etmek zorunda değilsiniz. Ödeme yapmazsanız hiçbir ücret alınmaz.
        </p>
      </div>
    </div>
  );
}

function Notice({
  title,
  body,
  href = "/urunler",
  cta = "Sepetlere dön",
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bark-soft">{body}</p>
      <Link
        href={href}
        className="mt-8 inline-flex rounded-full border border-line px-6 py-3 text-sm font-semibold hover:bg-sand"
      >
        {cta}
      </Link>
    </div>
  );
}
