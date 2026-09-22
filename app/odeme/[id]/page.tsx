import type { Metadata } from "next";
import Link from "next/link";
import { sql, type Reservation } from "@/lib/db";
import { buildPayForm, orderId, PRODUCT_TYPE } from "@/lib/shopier";
import { formatTRY } from "@/lib/brand";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

type Row = Reservation & { product_title: string };

export default async function PayPage({ params }: PageProps<"/odeme/[id]">) {
  const { id } = await params;

  let row: Row | undefined;
  try {
    const rows = (await sql`
      select r.*, p.title as product_title
      from reservations r join products p on p.id = r.product_id
      where r.public_id = ${id} limit 1
    `) as unknown as Row[];
    row = rows[0];
  } catch {
    return <Notice title="Ödeme sayfası açılamadı" body="Lütfen birazdan tekrar deneyin." />;
  }

  if (!row) {
    return <Notice title="Bu bağlantı geçersiz" body="Ödeme bağlantısını e-postanızdan tekrar kontrol edin." />;
  }

  if (row.status === "paid") {
    return (
      <Notice
        title="Bu sipariş zaten ödendi"
        body="Teşekkürler! Eda sepetinizi hazırlıyor, kargoya verildiğinde size yazacağız."
      />
    );
  }

  if (row.status !== "accepted") {
    return (
      <Notice
        title="Bu talep ödemeye açık değil"
        body="Talebiniz henüz onaylanmadı ya da kapatıldı. Sorunuz varsa bize Instagram'dan yazabilirsiniz."
      />
    );
  }

  if (row.pay_expires_at && new Date(row.pay_expires_at) < new Date()) {
    return (
      <Notice
        title="Ödeme süresi doldu"
        body="Ayırdığımız süre içinde ödeme alınmadığı için sepet tekrar satışa açıldı. Hâlâ istiyorsanız yeni bir talep gönderin."
      />
    );
  }

  const [name, ...rest] = row.name.trim().split(/\s+/);
  const form = buildPayForm({
    orderId: orderId.forReservation(row.public_id),
    productName: row.product_title,
    productType: PRODUCT_TYPE.physical,
    priceKurus: row.price_kurus,
    buyer: {
      name,
      surname: rest.join(" ") || name,
      email: row.email,
      phone: row.phone,
    },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="rounded-none border border-hair bg-raised p-8 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Ödeme</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">{row.product_title}</h1>

        <dl className="mt-7 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-bark-soft">Alıcı</dt>
            <dd className="font-medium">{row.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-bark-soft">E-posta</dt>
            <dd className="font-medium">{row.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-hair pt-3">
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
            className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
          >
            Shopier ile güvenli öde
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-bark-soft">
          Ödeme Shopier üzerinden alınır. Kart bilgileriniz bu siteye hiçbir zaman girilmez.
        </p>
      </div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bark-soft">{body}</p>
      <Link
        href="/urunler"
        className="mt-8 inline-flex rounded-sm border border-hair px-6 py-3 text-sm font-semibold hover:bg-sand"
      >
        Sepetlere dön
      </Link>
    </div>
  );
}
