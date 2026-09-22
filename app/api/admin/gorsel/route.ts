import { isAdmin } from "@/lib/auth";
import { putPublic } from "@/lib/storage";
import { publicId, slugify } from "@/lib/ids";

/** Browser resizes before sending, so this ceiling is a guard, not the plan. */
const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return Response.json({ error: "Yetkisiz." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const file = form.get("dosya");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Sadece JPG, PNG veya WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Görsel çok büyük." }, { status: 413 });
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "gorsel";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // Unguessable suffix: two products with the same filename must not collide,
  // and a stale CDN copy must never be served for a new photo.
  const key = `urunler/${base}-${publicId(8)}.${ext}`;

  try {
    const url = await putPublic(key, new Uint8Array(await file.arrayBuffer()), file.type);
    return Response.json({ url });
  } catch (err) {
    console.error("[yükleme] başarısız", err);
    return Response.json({ error: "Yükleme başarısız." }, { status: 500 });
  }
}
