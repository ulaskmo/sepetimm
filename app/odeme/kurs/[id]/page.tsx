import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";
import { buildPayForm, orderId, PRODUCT_TYPE } from "@/lib/shopier";
import { formatTRY } from "@/lib/brand";

export const metadata: Metadata = { title: "Kurs ödemesi", robots: { index: false } };

type Row = {
  public_id: string;
  email: string;
  name: string | null;
  status: string;
  price_kurus: number;
  course_title: string;
};

export default async function CoursePayPage({ params }: PageProps<"/odeme/kurs/[id]">) {
  const { id } = await params;

  let row: Row | undefined;
  try {
    const rows = (await sql`
      select o.public_id, o.email, o.name, o.status, o.price_kurus, c.title as course_title
      from course_orders o join courses c on c.id = o.course_id
      where o.public_id = ${id} limit 1
    `) as unknown as Row[];
    row = rows[0];
  } catch {
    return <Notice title="Sayfa açılamadı" body="Lütfen birazdan tekrar deneyin." />;
  }

  if (!row) return <Notice title="Bu bağlantı geçersiz" body="Kurs sayfasından tekrar deneyin." />;

  if (row.status === "paid") {
    return (
      <Notice
        title="Bu kurs zaten sizde"
        body="Hesabım sayfasından e-postanızla giriş yapıp izleyebilirsiniz."
        href="/hesabim"
        cta="Hesabıma git"
      />
    );
  }

  const [name, ...rest] = (row.name ?? "Kursiyer").trim().split(/\s+/);
  const form = buildPayForm({
    orderId: orderId.forCourse(row.public_id),
    productName: row.course_title,
    productType: PRODUCT_TYPE.digital,
    priceKurus: row.price_kurus,
    buyer: { name, surname: rest.join(" ") || name, email: row.email },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-line bg-raised p-8 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.2em] text-bark-soft">Kurs ödemesi</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">{row.course_title}</h1>

        <dl className="mt-7 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-bark-soft">Erişim e-postası</dt>
            <dd className="font-medium">{row.email}</dd>
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
          Ödeme sonrası kurs bu e-posta adresine tanımlanır.
        </p>
      </div>
    </div>
  );
}

function Notice({
  title,
  body,
  href = "/kurslar",
  cta = "Kurslara dön",
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
