import { sql, type Course, type Product, type Reservation } from "./db";

/**
 * Reads used by pages. They swallow connection errors on purpose: before the
 * database is provisioned the site should render an empty shop, not a 500.
 * Writes (reservations, payments) never go through here — those must fail loud.
 */
async function safe<T>(run: () => Promise<T>, fallback: T, what: string): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error(`[db] ${what} okunamadı:`, (err as Error).message);
    return fallback;
  }
}

export function listProducts(): Promise<Product[]> {
  return safe(
    async () =>
      (await sql`
        select * from products
        where published = true
        order by sold asc, sort_order asc, created_at desc
      `) as unknown as Product[],
    [],
    "ürün listesi"
  );
}

export function featuredProducts(limit = 3): Promise<Product[]> {
  return safe(
    async () =>
      (await sql`
        select * from products
        where published = true and sold = false
        order by sort_order asc, created_at desc
        limit ${limit}
      `) as unknown as Product[],
    [],
    "öne çıkan ürünler"
  );
}

export function getProduct(slug: string): Promise<Product | null> {
  return safe(
    async () => {
      const rows = (await sql`
        select * from products where slug = ${slug} and published = true limit 1
      `) as unknown as Product[];
      return rows[0] ?? null;
    },
    null,
    `ürün ${slug}`
  );
}

export function listCourses(): Promise<Course[]> {
  return safe(
    async () =>
      (await sql`
        select * from courses where published = true
        order by sort_order asc, created_at asc
      `) as unknown as Course[],
    [],
    "kurs listesi"
  );
}

export function getCourse(slug: string): Promise<Course | null> {
  return safe(
    async () => {
      const rows = (await sql`
        select * from courses where slug = ${slug} and published = true limit 1
      `) as unknown as Course[];
      return rows[0] ?? null;
    },
    null,
    `kurs ${slug}`
  );
}

/** Courses this email has actually paid for. The only gate on video access. */
export function ownedCourses(email: string): Promise<Course[]> {
  return safe(
    async () =>
      (await sql`
        select c.* from courses c
        join course_orders o on o.course_id = c.id
        where lower(o.email) = lower(${email}) and o.status = 'paid'
        order by o.paid_at desc
      `) as unknown as Course[],
    [],
    "sahip olunan kurslar"
  );
}

export function ownsCourse(email: string, courseId: number): Promise<boolean> {
  return safe(
    async () => {
      const rows = await sql`
        select 1 from course_orders
        where lower(email) = lower(${email}) and course_id = ${courseId} and status = 'paid'
        limit 1
      `;
      return rows.length > 0;
    },
    false,
    "kurs sahipliği"
  );
}

export function getReservation(publicId: string): Promise<Reservation | null> {
  return safe(
    async () => {
      const rows = (await sql`
        select * from reservations where public_id = ${publicId} limit 1
      `) as unknown as Reservation[];
      return rows[0] ?? null;
    },
    null,
    "rezervasyon"
  );
}
