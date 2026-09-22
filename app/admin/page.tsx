import type { Metadata } from "next";
import { sql, type Course, type Product } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { formatTRY } from "@/lib/brand";
import * as actions from "./actions";
import { ProductForm, CourseForm } from "./forms";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false } };

// isAdmin() returns early when ADMIN_PASSWORD is unset, so cookies() is never
// touched and the page would prerender as a static login screen. Force it.
export const dynamic = "force-dynamic";

type ReservationRow = {
  public_id: string;
  name: string;
  email: string;
  status: string;
  price_kurus: number;
  created_at: string;
  product_title: string;
};

const STATUS_TR: Record<string, string> = {
  pending: "Bekliyor",
  accepted: "Onaylandı",
  paid: "Ödendi",
  declined: "Reddedildi",
  expired: "Süresi doldu",
  cancelled: "İptal",
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdmin())) return <LoginGate />;

  const { duzenle, kurs } = await searchParams;
  const editProductId = Number(Array.isArray(duzenle) ? duzenle[0] : duzenle) || 0;
  const editCourseId = Number(Array.isArray(kurs) ? kurs[0] : kurs) || 0;

  const [products, courses, reservations] = await Promise.all([
    sql`select * from products order by created_at desc` as unknown as Promise<Product[]>,
    sql`select * from courses order by created_at desc` as unknown as Promise<Course[]>,
    sql`
      select r.public_id, r.name, r.email, r.status, r.price_kurus, r.created_at,
             p.title as product_title
      from reservations r join products p on p.id = r.product_id
      order by r.created_at desc limit 50
    ` as unknown as Promise<ReservationRow[]>,
  ]);

  const editProduct = products.find((p) => p.id === editProductId);
  const editCourse = courses.find((c) => c.id === editCourseId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Yönetim</h1>
        <form action={actions.logout}>
          <button className="text-sm text-bark-soft underline hover:text-rattan-deep">
            Çıkış yap
          </button>
        </form>
      </header>

      <Section title="Rezervasyon talepleri">
        {reservations.length === 0 ? (
          <Empty>Henüz talep yok.</Empty>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-sm border border-hair">
            {reservations.map((r) => (
              <li key={r.public_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-raised px-5 py-4 text-sm">
                <span className="font-medium">{r.product_title}</span>
                <span className="text-bark-soft">{r.name} · {r.email}</span>
                <span className="ml-auto font-medium">{formatTRY(r.price_kurus)}</span>
                <span
                  className={`rounded-sm px-3 py-1 text-xs font-medium ${
                    r.status === "paid"
                      ? "bg-sage/20 text-sage"
                      : r.status === "pending"
                        ? "bg-rattan/20 text-rattan-deep"
                        : "bg-sand text-bark-soft"
                  }`}
                >
                  {STATUS_TR[r.status] ?? r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-bark-soft">
          Talepleri Telegram&apos;dan onaylıyor ya da reddediyorsunuz. Bu liste sadece geçmişi gösterir.
        </p>
      </Section>

      <Section title={editProduct ? `Ürünü düzenle: ${editProduct.title}` : "Yeni ürün ekle"}>
        <ProductForm key={editProduct?.id ?? "new"} product={editProduct} action={actions.saveProduct} />
      </Section>

      <Section title="Ürünler">
        {products.length === 0 ? (
          <Empty>Henüz ürün yok.</Empty>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-sm border border-hair">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-raised px-5 py-4 text-sm">
                <span className="font-medium">{p.title}</span>
                <span className="text-bark-soft">{formatTRY(p.price_kurus)}</span>
                {!p.published && <Tag>Gizli</Tag>}
                {p.sold && <Tag>Satıldı</Tag>}
                <Tag>{p.kind === "unique" ? "Tek parça" : "Siparişe özel"}</Tag>
                <span className="ml-auto flex gap-3">
                  <a href={`/admin?duzenle=${p.id}`} className="underline hover:text-rattan-deep">
                    Düzenle
                  </a>
                  <form action={actions.deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-red-600 underline dark:text-red-400">Gizle</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={editCourse ? `Kursu düzenle: ${editCourse.title}` : "Yeni kurs ekle"}>
        <CourseForm key={editCourse?.id ?? "new"} course={editCourse} action={actions.saveCourse} />
      </Section>

      <Section title="Kurslar">
        {courses.length === 0 ? (
          <Empty>Henüz kurs yok.</Empty>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-sm border border-hair">
            {courses.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-raised px-5 py-4 text-sm">
                <span className="font-medium">{c.title}</span>
                <span className="text-bark-soft">{formatTRY(c.price_kurus)}</span>
                {!c.published && <Tag>Gizli</Tag>}
                {!c.bunny_video_id && <Tag>Video yok</Tag>}
                <span className="ml-auto flex gap-3">
                  <a href={`/admin?kurs=${c.id}`} className="underline hover:text-rattan-deep">
                    Düzenle
                  </a>
                  <form action={actions.deleteCourse}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-red-600 underline dark:text-red-400">Gizle</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function LoginGate() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Yönetim girişi</h1>
      <form action={actions.login} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Şifre</span>
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-sm border border-hair bg-bg px-4 py-3 text-sm outline-none focus:border-rattan"
          />
        </label>
        <button className="w-full rounded-sm bg-bark px-6 py-4 text-sm font-semibold text-bg">
          Giriş yap
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-sm border border-dashed border-hair px-5 py-8 text-center text-sm text-bark-soft">
      {children}
    </p>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-sand px-2.5 py-0.5 text-xs text-bark-soft">{children}</span>
  );
}
