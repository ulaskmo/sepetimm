import type { Course, Product } from "@/lib/db";

const input =
  "w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-rattan";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-bark-soft">{hint}</span>}
    </label>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--bark)]" />
      {label}
    </label>
  );
}

export function ProductForm({
  product,
  action,
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-raised p-6 sm:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Başlık">
        <input name="title" required defaultValue={product?.title} className={input} />
      </Field>

      <Field label="Fiyat (TL)">
        <input
          name="price"
          required
          inputMode="decimal"
          defaultValue={product ? (product.price_kurus / 100).toFixed(2) : ""}
          className={input}
        />
      </Field>

      <Field label="Açıklama" hint="Satır aralarını koruyarak gösterilir.">
        <textarea name="description" rows={4} defaultValue={product?.description} className={`${input} resize-y`} />
      </Field>

      <Field
        label="Fotoğraflar"
        hint="Her satıra bir adres. Şimdilik hazır bir görsel adresi yapıştırın (ör. /urunler/hasir-oval-sepet.jpg)."
      >
        <textarea name="images" rows={4} defaultValue={product?.images.join("\n")} className={`${input} resize-y`} />
      </Field>

      <Field label="Üretim tipi">
        <select name="kind" defaultValue={product?.kind ?? "unique"} className={input}>
          <option value="unique">Tek parça — fotoğraftaki sepetin kendisi</option>
          <option value="made_to_order">Siparişe özel — tekrar örülebilir</option>
        </select>
      </Field>

      <Field label="Hazırlanma süresi (gün)" hint="Sadece siparişe özel ürünler için.">
        <input
          name="lead_time_days"
          inputMode="numeric"
          defaultValue={product?.lead_time_days ?? ""}
          className={input}
        />
      </Field>

      <Field label="Ölçüler" hint="Örn: 38 × 24 × 18 cm">
        <input name="dimensions" defaultValue={product?.dimensions ?? ""} className={input} />
      </Field>

      <Field label="Web adresi (slug)" hint="Boş bırakırsanız başlıktan üretilir.">
        <input name="slug" defaultValue={product?.slug} className={input} />
      </Field>

      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <Check name="published" label="Sitede görünsün" defaultChecked={product?.published ?? true} />
        <Check name="sold" label="Satıldı" defaultChecked={product?.sold ?? false} />
        <button className="ml-auto rounded-full bg-bark px-7 py-3 text-sm font-semibold text-bg">
          {product ? "Değişiklikleri kaydet" : "Ürünü ekle"}
        </button>
      </div>
    </form>
  );
}

export function CourseForm({
  course,
  action,
}: {
  course?: Course;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-raised p-6 sm:grid-cols-2">
      {course && <input type="hidden" name="id" value={course.id} />}

      <Field label="Başlık">
        <input name="title" required defaultValue={course?.title} className={input} />
      </Field>

      <Field label="Fiyat (TL)">
        <input
          name="price"
          required
          inputMode="decimal"
          defaultValue={course ? (course.price_kurus / 100).toFixed(2) : ""}
          className={input}
        />
      </Field>

      <Field label="Açıklama">
        <textarea name="description" rows={4} defaultValue={course?.description} className={`${input} resize-y`} />
      </Field>

      <Field label="Kapak görseli" hint="Adres yapıştırın ya da boş bırakın.">
        <input name="cover_image" defaultValue={course?.cover_image ?? ""} className={input} />
      </Field>

      <Field label="Bunny video kimliği" hint="Bunny Stream'de videoyu açınca görünen GUID.">
        <input name="bunny_video_id" defaultValue={course?.bunny_video_id ?? ""} className={input} />
      </Field>

      <Field label="Süre (dakika)">
        <input
          name="minutes"
          inputMode="decimal"
          defaultValue={course?.duration_sec ? Math.round(course.duration_sec / 60) : ""}
          className={input}
        />
      </Field>

      <Field label="Seviye">
        <select name="level" defaultValue={course?.level ?? "baslangic"} className={input}>
          <option value="baslangic">Başlangıç</option>
          <option value="orta">Orta</option>
          <option value="ileri">İleri</option>
        </select>
      </Field>

      <Field label="Web adresi (slug)" hint="Boş bırakırsanız başlıktan üretilir.">
        <input name="slug" defaultValue={course?.slug} className={input} />
      </Field>

      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <Check name="published" label="Sitede görünsün" defaultChecked={course?.published ?? false} />
        <button className="ml-auto rounded-full bg-bark px-7 py-3 text-sm font-semibold text-bg">
          {course ? "Değişiklikleri kaydet" : "Kursu ekle"}
        </button>
      </div>
    </form>
  );
}
