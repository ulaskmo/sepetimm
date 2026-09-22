export const BRAND = {
  name: "Eda'nın Tasarımları",
  handle: "eda.nintasarimlari",
  instagram: "https://instagram.com/eda.nintasarimlari",
  city: "Giresun",
  tagline: "Tek tek elde örülen sepetler ve çantalar",
} as const;

/** Public site URL. Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically. */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export function formatTRY(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: kurus % 100 === 0 ? 0 : 2,
  }).format(kurus / 100);
}
