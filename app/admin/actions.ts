"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { adminCookieValue, isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/ids";

/** Every mutation below re-checks this. A server action is a public endpoint. */
async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Yetkisiz işlem.");
}

function kurus(input: FormDataEntryValue | null): number {
  const n = Number(String(input ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Geçersiz fiyat.");
  return Math.round(n * 100);
}

function imageList(input: FormDataEntryValue | null): string[] {
  return String(input ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  // A thrown error inside a server action renders as a crash page in
  // production — Next hides the message. Redirect back with a flag instead,
  // which also works with no JavaScript at all.
  if (!expected) redirect("/admin?hata=kurulum");
  if (password !== expected) redirect("/admin?hata=sifre");

  (await cookies()).set("sepetim_admin", adminCookieValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/admin");
}

export async function logout() {
  (await cookies()).delete("sepetim_admin");
  revalidatePath("/admin");
}

export async function saveProduct(formData: FormData) {
  await assertAdmin();

  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) throw new Error("Başlık gerekli.");

  const slug = String(formData.get("slug") ?? "").trim() || slugify(title);
  const description = String(formData.get("description") ?? "").trim();
  const price = kurus(formData.get("price"));
  const images = imageList(formData.get("images"));
  const kind = formData.get("kind") === "made_to_order" ? "made_to_order" : "unique";
  const leadRaw = String(formData.get("lead_time_days") ?? "").trim();
  const lead = leadRaw ? Number(leadRaw) : null;
  const dimensions = String(formData.get("dimensions") ?? "").trim() || null;
  const published = formData.get("published") === "on";
  const sold = formData.get("sold") === "on";

  if (id > 0) {
    await sql`
      update products set
        slug = ${slug}, title = ${title}, description = ${description},
        price_kurus = ${price}, images = ${images}, kind = ${kind},
        lead_time_days = ${lead}, dimensions = ${dimensions},
        published = ${published}, sold = ${sold}
      where id = ${id}
    `;
  } else {
    await sql`
      insert into products (slug, title, description, price_kurus, images, kind,
                            lead_time_days, dimensions, published, sold)
      values (${slug}, ${title}, ${description}, ${price}, ${images}, ${kind},
              ${lead}, ${dimensions}, ${published}, ${sold})
    `;
  }

  revalidatePath("/admin");
  revalidatePath("/urunler");
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id") ?? 0);
  // Kept as a soft delete: a product with a paid reservation must stay joinable.
  await sql`update products set published = false where id = ${id}`;
  revalidatePath("/admin");
  revalidatePath("/urunler");
}

export async function saveCourse(formData: FormData) {
  await assertAdmin();

  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) throw new Error("Başlık gerekli.");

  const slug = String(formData.get("slug") ?? "").trim() || slugify(title);
  const description = String(formData.get("description") ?? "").trim();
  const price = kurus(formData.get("price"));
  const cover = String(formData.get("cover_image") ?? "").trim() || null;
  const videoId = String(formData.get("bunny_video_id") ?? "").trim() || null;
  const minutes = String(formData.get("minutes") ?? "").trim();
  const duration = minutes ? Math.round(Number(minutes) * 60) : null;
  const levelRaw = String(formData.get("level") ?? "baslangic");
  const level = ["baslangic", "orta", "ileri"].includes(levelRaw) ? levelRaw : "baslangic";
  const published = formData.get("published") === "on";

  if (id > 0) {
    await sql`
      update courses set
        slug = ${slug}, title = ${title}, description = ${description},
        price_kurus = ${price}, cover_image = ${cover}, bunny_video_id = ${videoId},
        duration_sec = ${duration}, level = ${level}, published = ${published}
      where id = ${id}
    `;
  } else {
    await sql`
      insert into courses (slug, title, description, price_kurus, cover_image,
                           bunny_video_id, duration_sec, level, published)
      values (${slug}, ${title}, ${description}, ${price}, ${cover},
              ${videoId}, ${duration}, ${level}, ${published})
    `;
  }

  revalidatePath("/admin");
  revalidatePath("/kurslar");
}

export async function deleteCourse(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id") ?? 0);
  await sql`update courses set published = false where id = ${id}`;
  revalidatePath("/admin");
  revalidatePath("/kurslar");
}
